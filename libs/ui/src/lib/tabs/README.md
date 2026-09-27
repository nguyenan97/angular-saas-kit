# Tabs

Tabs with automatic activation: the tab that gets focus opens.

```html
<ask-tabs label="Settings" [(selectedIndex)]="tab">
  <ask-tab label="Profile">...</ask-tab>
  <ask-tab label="Appearance">...</ask-tab>
  <ask-tab label="Billing" disabled>...</ask-tab>
</ask-tabs>
```

| `Tabs` input    | Type            | Default | Notes                                              |
| --------------- | --------------- | ------- | -------------------------------------------------- |
| `label`         | `string`        | `''`    | The tab list's name, unless `labelledBy` names it. |
| `labelledBy`    | `string`        | `''`    | The id of a visible heading that names the list.   |
| `selectedIndex` | `model<number>` | `0`     | Two-way: which tab is open.                        |
| `class`         | `string`        | `''`    | Merged last onto the host.                         |

| `Tab` input | Type      | Default | Notes                                        |
| ----------- | --------- | ------- | -------------------------------------------- |
| `label`     | `string`  | —       | Required. The tab's text.                    |
| `disabled`  | `boolean` | `false` | Skipped by the arrow keys, ignored on click. |

Only the open tab's panel is rendered.

## Accessibility

This is the WAI-ARIA tabs pattern, with the roving focus from the CDK's `FocusKeyManager`:

- The tab list is **one tab stop**: Tab lands on the open tab, and the next Tab goes to the
  panel (`tabindex="0"`), then on through the page.
- **Left and Right** move between tabs and wrap at the ends; in a right-to-left page they are
  mirrored. **Home** and **End** go to the first and last tab. Disabled tabs are skipped.
- Each tab is `role="tab"` with `aria-selected`; the open one controls the panel, which is
  `role="tabpanel"` and labelled by its tab.
- **Name the tab list** with `label`, or `labelledBy` a heading, when the page has more than
  one or when the tabs alone do not say what they switch between.
