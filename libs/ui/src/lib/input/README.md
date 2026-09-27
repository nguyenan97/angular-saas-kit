# Input and Label

`askInput` styles a native text `<input>`, `<textarea>` or `<select>`; `askLabel` styles a
native `<label>`. The elements stay the real ones, so forms, validation, autofill and the
platform's pickers keep working.

<!-- prettier-ignore -->
```html
<label askLabel for="email">Email</label>
<input
  askInput
  id="email"
  type="email"
  autocomplete="email"
  [formControl]="email"
  [attr.aria-invalid]="email.invalid && email.touched"
  aria-describedby="email-error"
/>
@if (email.invalid && email.touched) {
  <p id="email-error" class="text-sm text-destructive">Enter an email address.</p>
}
```

| Directive | Selector                                                    | Input   |
| --------- | ----------------------------------------------------------- | ------- |
| `Input`   | `input[askInput]`, `textarea[askInput]`, `select[askInput]` | `class` |
| `Label`   | `label[askLabel]`                                           | `class` |

`class` is merged last, so it wins. `Input` shares its name with Angular's `@Input`
decorator; in a file that uses both, import one under another name.

## Accessibility

- **Every field has a label:** `<label for>` with the field's `id`, or the field inside the
  label. A placeholder is not a label.
- **Show an error in text**, and connect it: `aria-invalid="true"` on the field (the border
  turns `destructive`) and `aria-describedby` pointing at the message.
- The border is `border-input`, which the contrast test in `libs/tokens` holds to 3:1
  against the page: a field's border is how the field is found.
- For checkboxes and radios use the native inputs; `askInput` is for text-like fields.
