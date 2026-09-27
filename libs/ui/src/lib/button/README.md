# Button

Styles a native `<button>` or `<a>`. It is a directive, so the element stays the real
one: the button keeps its keyboard behaviour, `type` and `disabled`; the link keeps its
`href`.

```html
<button type="button" askButton>Save</button>
<button type="button" askButton variant="outline" size="sm">Cancel</button>
<button type="button" askButton variant="ghost" size="icon" aria-label="Close">
  <ask-icon [icon]="x" />
</button>
<a askButton variant="link" href="/orders">All orders</a>
```

| Input     | Type                                                                          | Default     |
| --------- | ----------------------------------------------------------------------------- | ----------- |
| `variant` | `'default' \| 'secondary' \| 'outline' \| 'ghost' \| 'destructive' \| 'link'` | `'default'` |
| `size`    | `'sm' \| 'md' \| 'lg' \| 'icon'`                                              | `'md'`      |
| `class`   | `string`, merged last so it wins                                              | `''`        |

## Accessibility

- **Use a `<button>` for an action and an `<a>` for navigation.** The directive styles
  both the same way; the element decides what assistive technology announces.
- **Write `type="button"`** unless the button submits a form: a `<button>` in a form
  submits by default.
- **An icon-only button needs a name:** `aria-label` on the button, with the icon left
  decorative.
- Focus shows the kit's ring (`:focus-visible` in the tokens). `disabled` removes the button
  from the tab order; `aria-disabled="true"` keeps it focusable and dims it, for a button
  whose reason for being unavailable should stay discoverable.
