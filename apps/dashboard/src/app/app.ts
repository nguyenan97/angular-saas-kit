import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * The root: nothing but the router outlet. The routes choose the layout, the
 * dashboard's shell or the centred card of the sign-in pages
 * (`app.routes.ts`).
 */
@Component({
  selector: 'ask-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}
