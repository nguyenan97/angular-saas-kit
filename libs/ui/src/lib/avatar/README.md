# Avatar

A person or account: a picture, or initials when there is none or it fails to load.

```html
<ask-avatar name="Ada Lovelace" src="/ada.png" />
<ask-avatar name="Grace Hopper" class="size-12" />
```

| Input   | Type                             | Default |
| ------- | -------------------------------- | ------- |
| `name`  | `string`, required               |         |
| `src`   | `string`, the picture            | `''`    |
| `class` | `string`, merged last so it wins | `''`    |

## Accessibility

- The host is `role="img"` named by `name`; the picture and initials inside are decorative.
- Initials are the first letters of the first and last word of `name`.
