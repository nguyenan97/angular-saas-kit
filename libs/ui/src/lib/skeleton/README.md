# Skeleton

A placeholder shaped like the content that is loading.

```html
<div aria-busy="true">
  <ask-skeleton class="h-4 w-40" />
</div>
```

| Input   | Type                             | Default |
| ------- | -------------------------------- | ------- |
| `class` | `string`, merged last so it wins | `''`    |

## Accessibility

- Hidden from assistive technology (`aria-hidden`); mark the loading region with
  `aria-busy="true"` and say so in text where it matters.
- The pulse stops under `prefers-reduced-motion`.
