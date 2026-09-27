# Table and SortHeader

`askTable` styles a native `<table>` and everything in it, so the markup stays plain HTML.
`ask-sort-header` makes a column header sortable.

<!-- prettier-ignore -->
```html
<div class="overflow-x-auto" tabindex="0" role="region" aria-label="Orders">
  <table askTable>
    <caption>Latest orders</caption>
    <thead>
      <tr>
        <th scope="col">
          <ask-sort-header column="customer" [(sort)]="sort">Customer</ask-sort-header>
        </th>
        <th scope="col">
          <ask-sort-header column="total" [(sort)]="sort">Total</ask-sort-header>
        </th>
      </tr>
    </thead>
    <tbody>
      @for (order of sorted(); track order.id) {
        <tr>
          <td>{{ order.customer }}</td>
          <td>{{ order.total }}</td>
        </tr>
      }
    </tbody>
  </table>
</div>
```

Sorting the rows is the page's job: read the `sort` model (a `Sort`, or `null`) in a
`computed`.

| `Table` input | Notes                           |
| ------------- | ------------------------------- |
| `class`       | Merged last onto the `<table>`. |

| `SortHeader` input | Type                  | Notes                                                     |
| ------------------ | --------------------- | --------------------------------------------------------- |
| `column`           | `string`              | Required. The key this header sorts by.                   |
| `sort`             | `model<Sort \| null>` | Two-way. Share one signal between the headers of a table. |
| `class`            | `string`              | Merged last onto the button.                              |

## Accessibility

- **Keep the table semantics:** a `caption`, `th scope="col"` for column headers, and `td`
  for cells. Screen readers then announce the headers as the user moves through the cells.
- **A sortable header is a button inside the `th`**, as the WAI-ARIA sortable-table example
  does, so it is reached by Tab and activated with Enter or Space. `aria-sort` goes on the
  header cell of the sorted column only, and nowhere else.
- **A wide table scrolls in its own container.** Give the container `tabindex="0"`, a
  `role="region"` and a name, so a keyboard user can scroll it and a screen reader user
  knows what it is.
