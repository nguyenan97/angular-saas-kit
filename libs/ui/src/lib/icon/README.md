# Icon

An inline SVG icon in the colour of the text around it. Draws any
[Lucide](https://lucide.dev/icons) icon, or a drawing of your own in the same shape.

```ts
import { Menu } from 'lucide';
import { Icon } from '@angular-saas-kit/ui';

@Component({
  imports: [Icon],
  template: `
    <ask-icon [icon]="menu" />
    <ask-icon
      [icon]="menu"
      label="Open menu"
      class="size-6 text-muted-foreground"
    />
  `,
})
export class Example {
  protected readonly menu = Menu;
}
```

| Input         | Type       | Default | Notes                                                              |
| ------------- | ---------- | ------- | ------------------------------------------------------------------ |
| `icon`        | `IconNode` | —       | Required. A Lucide icon, or `[tag, attributes][]` on a 24×24 grid. |
| `label`       | `string`   | `''`    | Makes the icon meaningful: `role="img"` with this name.            |
| `strokeWidth` | `number`   | `2`     | Line weight on the 24-unit grid.                                   |
| `class`       | `string`   | `''`    | Merged last. The default size is `size-4`.                         |

## Accessibility

- **Decorative by default.** Without a `label` the icon is `aria-hidden="true"`: when a
  button says "Delete", its trash icon would only repeat it.
- **Give a label when the icon stands alone**, such as the only content of a button. Or
  label the button itself (`aria-label`) and leave the icon decorative.
- The icon takes `currentColor`, so its contrast is the contrast of the text it sits in.

Why Lucide's data and not an icon package: [ADR 0017](../../../../../docs/adr/0017-icons-from-lucide-data-drawn-by-one-component.md).
