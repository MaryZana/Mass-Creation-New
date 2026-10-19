---
alwaysApply: true
---

# CSS Styles Rules

## Правила написания стилей

- Все стили пишутся в отдельных CSS Module файлах (`*.module.css`) — не inline-стили, не styled-components, не CSS-in-JS
- CSS Module файлы импортируются в компоненты: `import s from './Component.module.css'`
- Для условного применения классов используй библиотеку `clsx`

## Пример

```tsx
import clsx from 'clsx';
import s from './Button.module.css';

function Button({ active, disabled }: Props) {
  return (
    <button className={clsx(s.button, { [s.active]: active, [s.disabled]: disabled })}>
      Click
    </button>
  );
}
```
