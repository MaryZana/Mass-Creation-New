---
name: ritm-figma-client-mcp
description: >
  Use this skill whenever you work with RITM and the Figma MCP together — building
  or verifying UI from a Figma link. It covers wiring up the Figma MCP (remote vs
  local), always reading Figma modes before implementing, mapping modes to RITM
  props, and avoiding context-window overflow on get_design_context.
---

# RITM Figma → Code

Skill covers three things that repeatedly go wrong when an
agent implements or verifies UI from a RITM Figma file:

1. Wrong MCP transport (local vs remote).
2. Skipping Figma **modes**, so the agent never sees the real design-system
   context and guesses values.
3. `get_design_context` returning a giant React + Tailwind dump that overflows
   the context window and appears to "hang".

Read this before touching any Figma MCP tool.

---

## ⚠️ IMPORTANT — connect the REMOTE Figma MCP, not the local one

The **local / desktop** Figma MCP server is limited: it exposes fewer
capabilities, its node ids can differ from the remote ones (the same layer has a
different index in desktop vs remote), and it **cannot run `use_figma`** — the
only tool that can read design-system _modes_. Everything in this skill that
matters (modes, arbitrary Plugin-API reads) requires the **remote** server:

```
https://mcp.figma.com/mcp
```

**Rule for the agent:** at the start of any Figma task, confirm you are on the
remote MCP. If you cannot tell, or you only see local tools, **say so explicitly
in the chat** and ask the user to switch to the remote Figma MCP before
continuing. Do not silently fall back to the local server — its answers are
incomplete and its node ids may not resolve.

> Note: the remote server is in beta and may be a paid feature. `use_figma` is
> remote-only.

---

## ⚠️ IMPORTANT — always read the modes first

RITM encodes almost all of its design decisions as **Figma variable modes**
(collections like `◐ Themes`,
`✦ Breakpoints`, `◉ Priority`, `◉ Schemes`, etc.). The concrete color / size / spacing values a component shows are just the
_resolution_ of these modes. If you read values without reading the modes, you
are implementing a random snapshot and will silently miss theme, breakpoint,
scheme, priority and state context.

**The standard read tools do NOT give you modes.** `get_variable_defs` only
returns the _default_ resolved values — it hides which mode each value came from
and cannot list `Light/Dark`, `Style`, `Display`, etc. This is a known
limitation. The **only** reliable way to read modes is `use_figma`, which runs
JavaScript against the Figma Plugin API.

### How to read the modes — exact tool call

Before calling `use_figma` you MUST load its guidance (the `figma-use` skill, or
the `skill://figma/figma-use/SKILL.md` MCP resource). Then run this **read-only**
script, passing the node id you care about:

```js
// use_figma — read-only mode dump for a node
const node = await figma.getNodeByIdAsync('NODE_ID') // e.g. "4014:62"
if (!node) return { error: 'node not found on current page' }

const explicit = node.explicitVariableModes || {} // pinned on THIS node (right panel)
const resolved = node.resolvedVariableModes || {} // effective, incl. inheritance

const ids = new Set([...Object.keys(explicit), ...Object.keys(resolved)])
const modes = []
for (const cid of ids) {
  let coll = null
  try {
    coll = await figma.variables.getVariableCollectionByIdAsync(cid)
  } catch (e) {}
  const nameByMode = {}
  if (coll) for (const m of coll.modes) nameByMode[m.modeId] = m.name
  modes.push({
    collection: coll ? coll.name : '(remote/unknown)',
    availableModes: coll ? coll.modes.map(m => m.name) : [],
    explicitlySet: explicit[cid] ? nameByMode[explicit[cid]] || explicit[cid] : null,
    resolvedMode: resolved[cid] ? nameByMode[resolved[cid]] || resolved[cid] : null,
  })
}
return { nodeName: node.name, modes }
```

Tool: `use_figma` (remote). Pass `fileKey`, the `code` above (with a real
`NODE_ID`), a short `description`, and `skillNames` including `figma-use` (prefix
with `resource:` if the guidance was loaded via the MCP resource).

`explicitlySet` = the modes a designer pinned on that frame (what you see in the
right-hand panel). `resolvedMode` = what actually applies after inheritance from
the page/parents. Read both. To preview a different context (e.g. dark theme),
report what the values become when `◐ Themes` resolves to `Dark` — do not change
the file.

> `use_figma` is a general-purpose Plugin-API tool. Keep the script **read-only**
> here: fetch nodes, collections, `valuesByMode`. Do not create or mutate nodes
> when you are only inspecting.

---

## Map the modes to RITM props

Reading modes is only half the job — translate each mode to the React prop that
drives it. Many collections are **`RtFrame` context** (inherited down the tree),
so they map to props on an ancestor `RtFrame`, not on the component you are
building. The remaining collections are often props of the React component
itself.

> Figma labels are Title/space-cased; RITM prop values are lowercase-hyphenated.
> `"Non Inverted"` → `"non-inverted"`, `"RWB"` → `"rwb"`, `"Primary"` →
> `"primary"`.

### ⚠️ IMPORTANT — `use` / `modifier` / `surface` are the COMPONENT's own props, NOT `RtFrame` wrappers

This is the single most common mistake. There are **two kinds of modes**, and they
map to two different places:

- **Inherited frame context** — `theme`, `scheme`, `primitive`, `achromatic`,
  `typographyScheme`, `typescale`, `locale`, `sizeScheme`, `operatorScheme`,
  `breakpoints`. These are environmental: set them **once on `RtFrame.Root`** (or a
  nested `<RtFrame>` where a subtree genuinely differs). They flow down the tree.
- **Per-component visual props** — `use`, `modifier`, and (for surface-bearing
  components) `surface`. **Every RITM component — `RtButton`, `RtAvatar`,
  `RtFormFieldText`, `RtText`, `RtShell`, … — takes its own `use` / `modifier`
  props.** You set them **directly on that component**, read from **that
  component's Figma node**, not from the root and not from a wrapper.

**Do NOT wrap a component in `<RtFrame use=… modifier=… surface=…>` to recolor it.**
That is the wrong mental model and produces wrong results. To make the active
"Закупки" a white pill you write `<RtButton use="cloudy" modifier="base" />`, not
`<RtFrame surface="foundation-pure"><RtButton …/></RtFrame>`. Wrapping in `RtFrame`
is only for the **inherited** layers above, or to establish a **surface for plain
layout containers** (a bar/card/section you build yourself out of `<div>`-like
`RtFrame`s) — never to override `use`/`modifier` of a real component.

### Read PER-COMPONENT modes — root modes are not enough

Reading the root node gives you `scheme` / `theme` / `locale` / `sizeScheme` — the
inherited context. It does **not** tell you each button's / avatar's / field's
`use` and `modifier`. You must dump the **explicit** modes of **each component
instance** you reproduce. Drill to the real leaf RITM component (e.g.
`❖ RITM-Button/Grayscale/MD`), not a wrapper instance (`Build/Menu_Button`) — the
wrapper often has no explicit modes; the leaf carries them.

```js
// use_figma — per-component use/modifier/surface for a set of nodes
const root = await figma.getNodeByIdAsync('ROOT_ID')
const USE = ['❍ Active Use','◉ Priority','◉ Status','◉ Grayscale','◉ Information','◉ Achromatic']
const out = []
for (const n of root.findAll(x => x.type === 'INSTANCE' && /RITM-(Button|Avatar|Form-Field)/.test(x.name))) {
  const ex = n.explicitVariableModes || {}
  const r = { name: n.name, use: [], modifier: null, surface: [] }
  for (const cid of Object.keys(ex)) {
    let c = null; try { c = await figma.variables.getVariableCollectionByIdAsync(cid) } catch (e) {}
    if (!c) continue
    const mode = (c.modes.find(m => m.modeId === ex[cid]) || {}).name
    if (USE.includes(c.name)) r.use.push(`${c.name}=${mode}`)          // → component `use` prop
    else if (c.name === '◉ Modifiers') r.modifier = mode               // → component `modifier` prop
    else if (/Surfaces/.test(c.name)) r.surface.push(`${c.name}=${mode}`)
  }
  out.push(r)
}
return out
```

Then map: whichever `use`-collection is pinned gives the `use` value
(`◉ Grayscale=Cloudy` → `use="cloudy"`, `◉ Grayscale=Ashy` → `use="ashy"`,
`◉ Priority=Primary` → `use="primary"`), and `◉ Modifiers` gives `modifier`
(`Filling` → `modifier="filling"`, `Base` → `modifier="base"`). Confirm against the
resolved color token on the node (`control/grayscale/…`, `oncontrol/priority/…`) —
the token's middle segment echoes the `use`.

### `RtFrame` (inherited context) modes → props

Types below are exported from `@dpa/react-frame-pulse` (See real values in source code)

| Figma collection                                                     | Prop                                            | Type                                               | Example values                                                                                                                                                                                                          |
| -------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `❍ Active Use` / `◉ Priority` / `◉ Status`                           | `use`                                           | `RtUse`                                            | `primary`, `secondary`, `tertiary`, `quaternary`, `error`, `success`, `warning`, `neutral`, `generic`, `cloudy`, `ashy`, `foggy`, `notice`, `positive`, `attention`, `negative`, `achromatic-cloudy`, `achromatic-ashy` |
| `◉ Modifiers`                                                        | `modifier`                                      | `RtModifier`                                       | `base`, `mono`, `coloring`, `filling`                                                                                                                                                                                   |
| `◉ Schemes One`                                                      | `scheme`                                        | `RtScheme`                                         | `ritm`, `sky`, `asphalt`, `rwb`, `finance`, `cpp`, `atlas`                                                                                                                                                              |
| `◐ Themes`                                                           | `theme`                                         | `RtTheme`                                          | `light`, `dark`, `auto`                                                                                                                                                                                                 |
| `✦ Achromatics`                                                      | `achromatic`                                    | `RtAchromatic`                                     | `non-inverted`, `inverted`                                                                                                                                                                                              |
| `✦ Schemes` (Normal/Pastel/Acid/Contrast)                            | `primitive`                                     | `RtPrimitive`                                      | `normal`, `pastel`, `acid`, `contrast`                                                                                                                                                                                  |
| `𝚃 Schemes`                                                          | `typographyScheme`                              | `RtTypographyScheme`                               | `primary`, `display`, `alternative`, `generic`, `code`                                                                                                                                                                  |
| `𝚃 Typescale`                                                        | `typescale`                                     | `RtTypescale`                                      | `base`, `landing`                                                                                                                                                                                                       |
| `𝚃 Locale`                                                           | `locale`                                        | `RtLocale`                                         | `cyrillic`, `latin`, `arabic`, `armenian`, `chinese`                                                                                                                                                                    |
| `↔ Operators`                                                       | `operatorScheme`                                | `RtOperatorScheme`                                 | `ritm`, `smooth`                                                                                                                                                                                                        |
| `↔ Schemes` (RITM/WB/Prime)                                         | `sizeScheme`                                    | `RtSizeScheme`                                     | `ritm`, `wb`, `prime`                                                                                                                                                                                                   |
| `✦ Breakpoints*`                                                     | `breakpointScheme` / `breakpointXs\|Sm\|Md\|Lg` | `RtBreakpointScheme` / `RtBreakpointSegmentsProps` | `ritm`, `static`                                                                                                                                                                                                        |
| `✦ RITM Surface Priority` / `✦ RITM Surfaces Wrapper` / `Foundation` | `surface`                                       | `RtSurface`                                        | `wrapper`, `control`, `foundation-tint`, `foundation-pure`, …                                                                                                                                                           |
| `❍ Enabled Substate`                                                 | `surfaceState`                                  | `RtFrameSurfaceState`                              | `native`, `loading`, `disabled`, `dragged`, `static`                                                                                                                                                                    |

### `RtText` modes → props

`RtText` takes a composite `typography` string, `{type}-{size}-{variant}`, plus a
color `specification`. Types are exported from `@dpa/react-text`.

Color always inherits from surface.

| Figma concept                               | Prop                        | Type                  | Values                                              |
| ------------------------------------------- | --------------------------- | --------------------- | --------------------------------------------------- |
| text role (Symbol/Body/Title/Headline)      | `typography` (type part)    | `RtTextTypography`    | `symbol`, `body`, `title`, `headline`               |
| size                                        | `typography` (size part)    | —                     | `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`          |
| weight / emphasis                           | `typography` (variant part) | —                     | `regular`, `medium`, `bold`, `primary`, `secondary` |
| color role (`onwrapper` main/variant/muted) | `specification`             | `RtTextSpecification` | `main`, `variant`, `muted`                          |

Examples: `symbol-md-primary`, `headline-2xl-bold`. Text also inherits `locale`,
`typographyScheme`, `typescale` and `theme` from the ancestor `RtFrame` — the same
rows as the `RtFrame` table above.

> ⚠️ **Read the text STYLE name — never guess the token from the pixel size.** A
> Figma text node's `textStyleId` resolves to a style name that **is** the
> `typography` token: `"Title/SM Medium"` → `typography="title-sm-medium"`,
> `"Headline/2XL Bold"` → `"headline-2xl-bold"`. The raw `fontSize` (e.g. `22`) is
> the resolved px and does **not** tell you the token — the same 22px can be
> `title-sm`, `title-md`, etc. depending on `typescale`/`sizeScheme`. Guessing from
> px is how you end up with `title-xl` when the design says `title-sm`. Read it:
>
> ```js
> const t = await figma.getNodeByIdAsync('TEXT_ID')
> const style = t.textStyleId ? await figma.getStyleByIdAsync(t.textStyleId) : null
> return { styleName: style && style.name } // e.g. "Title/SM Medium" → title-sm-medium
> ```

### `RtFrame` surface provides `RtText` color

`RtText` carries **no color palette of its own**. Its `specification`
(`main` / `variant` / `muted`) is just a role that resolves against the surface
established by the nearest ancestor `<RtFrame surface=…>`:

| `RtFrame surface`                       | Text color tokens used                       |
| --------------------------------------- | -------------------------------------------- |
| `wrapper`                               | `onwrapper-{main\|variant}-{state}`          |
| `control`                               | `oncontrol-{main\|variant}-{state}`          |
| `foundation-*` (e.g. `foundation-tint`) | `onfoundation-{main\|variant\|muted}-{tint}` |

So the same `<RtText specification="main">` is black on a `wrapper` surface and a
different on-color on a `control` or `foundation` surface — the value is picked by
the surface, not by the text. Practical consequences:

- To get correct text color, put the text under an `RtFrame` with the `surface`
  that matches the Figma layer (the mode dump shows this as `onwrapper/…`,
  `oncontrol/…`, or `onfoundation/…` variables on the node).
- `muted` only exists on `foundation-*` surfaces; on `wrapper` / `control` only
  `main` and `variant` resolve.
- Surface also drives interaction states (`enabled` / `hovered` / `pressed` /
  `disabled`), so text color follows the surface's `surfaceState` too.

IMPORTANT `on-*` can be placed only on same surface type in figma (RtFrame validates it). If it didn't tell about it to user that designer did a mistake.

### Nested `RtFrame` = Figma mode inheritance

`RtFrame` composes exactly like Figma variable modes resolve through inheritance:

- `RtFrame.Root` sets the full baseline (all abstractions). Any nested
  `<RtFrame modifier=… theme=… …>` **overrides only the layers you pass** for its
  subtree; every unspecified layer keeps inheriting from the nearest ancestor.
- Direct analogy to the mode dump: a prop **set on a given `RtFrame`** ≈ that
  collection's `explicitVariableModes` on a node; what a leaf component actually
  renders with ≈ `resolvedVariableModes` (inheritance walked up to the Root).
- Practical rule: if an **inherited** mode is the same across the whole screen
  (theme, scheme, locale, sizeScheme), set it **once on `RtFrame.Root`**. If the
  dump shows an inherited mode **explicitly pinned** on an inner node, reproduce it
  as a nested `<RtFrame>` override at the matching level.
- `use` and `modifier` are **not** inherited-context layers you override via a
  nested `RtFrame` — they are **props on the component itself** (see the per-component
  section above). A component with no explicit `use`/`modifier` in Figma inherits a
  sensible default from context, but when the node pins them, pass them **on the
  component**, e.g. `<RtButton use="cloudy" modifier="base" />`.

---

## ⚠️ IMPORTANT — do not let `get_design_context` overflow the context window

`get_design_context` returns the node **already implemented as React + Tailwind**.
On a real product screen (or a `slot`/`instance` that wraps most of a page) that
payload is enormous. Symptoms: the call appears to hang / spin forever, or the
whole conversation degrades right after it. This is context overflow, not a
network hang. You usually **cannot** make this method return less for a given
node — so control _which_ node you ask for and _where its output goes_.

Also beware the trap: `get_metadata` ends its output with
_"you MUST call get_design_context …"_. Do **not** obey that blindly on a large
node — narrow down first.

### The safe workflow

1. **Map before you read.** Call `get_metadata` (no `nodeId`) to list pages, then
   `get_metadata` on the target frame to get the layer tree with node ids, sizes
   and names. Metadata is cheap; design context is not.
2. **Drill to the smallest node that contains what you need.** Metadata only
   exposes structure for things promoted to components/instances/slots. If the
   part you want lives inside a `slot`/`instance` whose only child is another
   huge instance (e.g. `Content2` = 80% of the page), you cannot address it more
   narrowly through metadata alone — see step 3.
3. **When you can't narrow enough, don't pull it into the model context.** Two
   options:
   - **Fan out to subagents.** Split the tree by top-level sections and give each
     section to its own subagent. Each subagent calls `get_design_context` on its
     slice and returns only a compact summary, so no single context holds the
     whole page.
   - **Dump to disk, then grep.** Have a script call the MCP and write the raw
     `get_design_context` response to a local file. The agent then greps/reads
     only the fragment it needs instead of holding the whole file. Better still,
     split the saved response into per-node chunks and strip noise so the model
     never minifies a giant blob in-context.
4. **Prefer a cleaned JSON tree as the source of truth.** A robust flow (works
   even for non-componentized layouts): use `use_figma` to walk the subtree and
   return a **cleaned** JSON node tree (ids, names, types, sizes, text, bound
   variables) with junk removed; save it; then build the UI from that JSON. This
   keeps each step small.
5. **Separate "collect" from "build".** Gathering Figma data and generating code
   are two different jobs, each context-heavy. Do them as distinct steps/agents:
   collect → cleaned JSON/summary → implement. This dramatically reduces the
   agent improvising.
6. **Transfer the layout in stages.** Build the skeleton first (structure,
   containers, spacing), then fill sections with detail. Incremental transfer
   produces far fewer hallucinated values than one giant one-shot.

### Node-id gotchas

- The same layer has **different ids in desktop vs remote**. Cursor-style
  plugins address the remote node only, so a copied desktop id may not resolve —
  another reason to standardize on the remote MCP.
- Figma only produces a clean, directly-addressable node id via "copy link" when
  the target is a component. For a plain layer you often get a link that points
  at its wrapping instance/slot, not the layer itself. In that case rely on
  `get_metadata` to get the real child ids, or walk the tree with `use_figma`.

---

## Minimal recommended sequence

1. Confirm **remote** Figma MCP (flag in chat if not).
2. `get_metadata` → map pages and the target subtree.
3. Narrow to the smallest meaningful node (you need a concrete node id for the
   next steps).
4. `use_figma` (read-only) → **dump root modes** for the inherited context
   (`theme`/`scheme`/`locale`/`sizeScheme`/…). _(mandatory before reading values)_
5. `use_figma` (read-only) → **dump PER-COMPONENT modes** for every button /
   avatar / field / etc. you will reproduce (`use` via `◉ Grayscale`/`◉ Priority`/…,
   `modifier` via `◉ Modifiers`, `surface`). Drill to the leaf RITM instance, not a
   `Build/*` wrapper. **For every text node, read its `textStyleId` style name** →
   that IS the `typography` token. _(mandatory — do not eyeball these)_
6. Translate: inherited layers → `RtFrame.Root` / nested `<RtFrame>`; `use` /
   `modifier` / `surface` / `typography` → **the component's own props**.
7. `get_variable_defs` for token values, `get_screenshot` for visual reference.
8. Only pull `get_design_context` on a small node — or fan out / dump-to-file for
   anything large.
9. Build in stages: skeleton → detail, keeping collect and build separate.
10. **Verify visually**: serve the app, screenshot the built page in Chrome (browser
    MCP) at the Figma frame's scale, and run a **separate judge agent** that diffs it
    against the `get_screenshot` reference. Apply its fixes and re-judge — loop until
    parity. Don't call it done on the first render.

## ⚠️ Sizing: don't fight the em base with CSS `font-size`

RITM components are sized in **em**, and the em base is owned by the frame
(`RtFrame.Root` with `isFontSizeProvider`) together with `sizeScheme` / `typescale`.
Consequences:

- **Never set `fontSize` in `style` to "scale" a component or the page**, and never
  wrap an icon in `transform: scale(…)`. It desyncs that subtree from every other
  em-sized value and produces the wrong size (a title that's `title-xl` big when the
  design is `title-sm`, an icon that's off, etc.). If something renders too big/small,
  the fix is the **right token/prop**, not a CSS override.
- To size a component, use **its own props** — `size` (`RtButton`, `RtAvatar`,
  `RtFormFieldText`, `RtShell`), `typography` (`RtText`, typography icons). Icons
  scale via their `typography`/`scale` prop, not a font-size wrapper.
- Set the em base **once** at the root, matching the design's `sizeScheme` (read from
  root modes — e.g. `↔ Schemes = Prime` → `sizeScheme="prime"`). Don't sprinkle
  per-element `fontSize`.

## ⚠️ Verify against Figma with a screenshot-judge agent — loop until parity

Reading modes correctly is necessary but not sufficient: you still miss things
(wrong `use`, oversized text, off spacing, a slate surface where white was meant).
**Do not trust your own build by looking at it yourself** — you are biased toward
seeing what you intended. Run an explicit visual diff loop with an **independent
judge subagent**, and keep looping until it reports parity.

The loop:

1. **Render the real thing.** Serve the app and open the built page in Chrome via
   the browser MCP (`claude-in-chrome` or `chrome-devtools`). Screenshot the node at
   the **same width/scale** as the Figma frame (e.g. 1440-wide frame → 1440 viewport)
   so sizes are comparable.
2. **Get the Figma reference.** `get_screenshot` on the same node (matching
   `maxDimension`). Save both PNGs to disk.
3. **Spawn a SEPARATE judge agent** (own context — images are heavy and an
   independent reviewer avoids self-confirmation). Give it **both screenshots** and
   ask for a **structured, prioritized diff**, not a vibe check:
   - missing / extra elements;
   - color mismatches (surface fills, text color, accents) — name the region;
   - size/typography mismatches (heading too big, icon too small);
   - spacing / alignment / radius / border deltas.
   It returns a verdict: `parity` or a concrete fix list (each tied to a component
   and a prop, e.g. "title too large → `title-xl` should be `title-sm`").
4. **Apply the fixes** (re-reading the offending node's per-component modes / text
   style if the judge flags color or size — don't re-guess), reload, re-screenshot,
   **re-judge**. Repeat until the judge returns `parity` (or only agreed-acceptable
   deltas, e.g. a placeholder icon).

Why a separate agent and not just your own eyes: the judge holds the two big images
so your main context stays lean, gives an unbiased read, and forces the diff to be
explicit and actionable instead of "looks about right". Never declare the build done
on the first render — it almost never matches on attempt one.

## Do / Don't

- **Do** state which modes are active before writing any code.
- **Do** run the screenshot-judge loop (independent agent) and iterate until it
  reports parity — never ship the first render unverified.
- **Do** set inherited modes (theme/scheme/locale/size) once on `RtFrame.Root`, and
  reproduce explicitly-pinned inner modes as nested `<RtFrame>` overrides.
- **Do** read `use` / `modifier` / `surface` from **each component's own node** and
  pass them **on the component** (`<RtButton use=… modifier=… />`) — never via a
  wrapping `RtFrame`.
- **Do** derive `RtText` `typography` from the node's **text-style name**
  (`textStyleId`), not from its pixel `fontSize`.
- **Do** tell the user when you're on the local MCP and need remote.
- **Do** save large Figma output to disk and grep it instead of inlining.
- **Don't** wrap a component in `<RtFrame use=…/surface=…>` to recolor it — that's for
  inherited context and plain layout surfaces only.
- **Don't** override `font-size` / `transform: scale` to resize components — use their
  `size`/`typography` props and the root em base.
- **Don't** call `get_design_context` on a whole page or a page-sized instance.
- **Don't** trust `get_variable_defs` for modes — it doesn't expose them.
- **Don't** mutate the Figma file while only inspecting.
