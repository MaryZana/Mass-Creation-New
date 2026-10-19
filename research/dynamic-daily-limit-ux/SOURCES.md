# Dynamic daily limit / budget automation UX — research

Дата: 2026-08-24. Фокус: Amazon Budget rules, Metadata, Яндекс.Директ «Адаптация бюджета».

## Скрины в этой папке

| Файл | Что это | Источник |
|---|---|---|
| `01-metadata-bid-agent.png` | Metadata Bid Agent: managed spend + график | https://metadata.io/announcement/november-2025-release-notes/ |
| `02-metadata-budget-change-events.png` | Metadata Events: `Daily budget changed from $X to $Y` | то же |
| `03-metadata-bid-agent-hires.png` | Тот же Bid Agent, крупнее | то же CDN image |
| `05-amazon-budget-rules-help.png` | Amazon Ads Help: создание Budget rules + таблица статусов | https://advertising.amazon.com/help/G3HZWVWYE23DBR2V |
| `06-yandex-budget-adaptation-help.png` | Яндекс.Директ Help: «Адаптация бюджета» | https://yandex.ru/support/direct/ru/strategies/budget-adaptation |
| `07-yandex-budget-adaptation-ui.png` | UI настройки: % увеличения + пояснение условий | CDN ассет со страницы выше |

## Amazon Ads — Budget rules

Правила **увеличивают** daily budget по schedule или performance.

В Campaign manager (по справке): **adjusted daily budget** + **rule status**  
(Active / On hold / Paused / Upcoming / Expired).

Публичного скрина самой строки Campaign Manager без логина нет — только help.

## Metadata.io

- Dashboard: волатильность spend под агентом.
- Events: явный лог from → to.

## Яндекс.Директ — Адаптация бюджета (очень близко к нам)

Если кампания эффективна, но упирается в бюджет — **автоувеличение** на %.

Условия за прошлую неделю:
1. израсходовано **> 90%** недельного бюджета;
2. CPA / ДРР **не выше** целевого;
3. не было рестарта стратегии из‑за смены настроек.

UI: поле «Процент увеличения бюджета» (20% / 10% / не увеличивать) + текст логики под опцией.

## Gaps

- Живой скрин Amazon Campaign Manager (adjusted budget в списке) — только из залогиненного Ads console.
