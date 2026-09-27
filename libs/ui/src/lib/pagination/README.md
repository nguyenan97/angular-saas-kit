# Pagination

Previous and next for a paged list, and where the user is: "Page 2 of 5".

```html
<p aria-live="polite">Showing 11 to 20 of {{ total() }} orders</p>
<table askTable>
  ...
</table>
<ask-pagination
  label="Orders pages"
  [total]="total()"
  [pageSize]="10"
  [(page)]="page"
/>
```

| Input      | Type            | Default   | Notes                                        |
| ---------- | --------------- | --------- | -------------------------------------------- |
| `page`     | `model<number>` | `1`       | Two-way. Counted from 1.                     |
| `total`    | `number`        | —         | Required. How many items the whole list has. |
| `pageSize` | `number`        | `10`      |                                              |
| `label`    | `string`        | `'Pages'` | The landmark's name: say what is paged.      |
| `class`    | `string`        | `''`      | Merged last onto the host.                   |

## Accessibility

- It is a `nav` landmark with a name, so a page with two lists has two distinguishable
  paginations.
- The buttons read "Previous page" and "Next page" to a screen reader.
- **At either end the button stays focusable** and is `aria-disabled`, instead of `disabled`.
  A disabled button cannot hold focus: pressing "Next" onto the last page would otherwise drop a
  keyboard user at the top of the document.
- **It does not announce the new page.** Announce it where the list is, in a live region such
  as "Showing 11 to 20 of 46 orders", so the user hears what changed, not only a page number.
