import {
  ChangeDetectionStrategy,
  Component,
  Renderer2,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
} from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { Label } from '@angular-saas-kit/ui';

let nextId = 0;

/**
 * One field of a dashboard form: its label, an optional hint, and its error,
 * tied to the control it wraps.
 *
 * The control is the `[formField]` inside, so the field is named once. Its
 * error is text under it, shown once the field has been left or the form
 * submitted, never while the user is still on their first attempt; while it
 * shows, the control is `aria-invalid` and described by it, after the hint.
 * Give the control an `id` to keep a stable one, or one is made up.
 *
 * Content marked `askFieldEnd`, such as a link, goes after the error.
 */
@Component({
  selector: 'ask-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Label],
  host: { class: 'flex flex-col gap-1.5' },
  template: `
    <label askLabel [for]="controlId()">
      {{ label() }}
      @if (optional()) {
        <span class="font-normal text-muted-foreground">(optional)</span>
      }
    </label>
    <ng-content />
    @if (hint()) {
      <p [id]="hintId()" class="text-sm text-muted-foreground">
        {{ hint() }}
      </p>
    }
    @if (errorShown()) {
      <p [id]="errorId()" class="text-sm text-destructive">
        {{ errorMessage() }}
      </p>
    }
    <ng-content select="[askFieldEnd]" />
  `,
})
export class FormFieldFrame {
  private readonly renderer = inject(Renderer2);
  private readonly fallbackId = `ask-field-${nextId++}`;

  /** What the field is, as its label says it. */
  readonly label = input.required<string>();
  /** Said before the user types, not after: the rules they would otherwise learn from an error. */
  readonly hint = input('');
  /** Marks the label "(optional)". */
  readonly optional = input(false, { transform: booleanAttribute });

  /** The control: the element in the content that carries `[formField]`. */
  private readonly control = contentChild.required(FormField, {
    descendants: true,
  });

  protected readonly controlId = computed(
    () => this.control().element.id || this.fallbackId,
  );
  protected readonly hintId = computed(() => `${this.controlId()}-hint`);
  protected readonly errorId = computed(() => `${this.controlId()}-error`);

  protected readonly errorShown = computed(() => {
    const state = this.control().state();
    return state.touched() && state.invalid();
  });
  protected readonly errorMessage = computed(
    () => this.control().state().errors()[0]?.message ?? '',
  );

  private readonly describedBy = computed(() =>
    [this.hint() ? this.hintId() : '', this.errorShown() ? this.errorId() : '']
      .filter(Boolean)
      .join(' '),
  );

  constructor() {
    // The control is the caller's element, so its attributes are set here
    // rather than bound in a template.
    effect(() => {
      const element = this.control().element;
      this.renderer.setAttribute(element, 'id', this.controlId());
      this.set(element, 'aria-invalid', this.errorShown() ? 'true' : '');
      this.set(element, 'aria-describedby', this.describedBy());
    });
  }

  private set(element: HTMLElement, name: string, value: string): void {
    if (value) {
      this.renderer.setAttribute(element, name, value);
    } else {
      this.renderer.removeAttribute(element, name);
    }
  }
}
