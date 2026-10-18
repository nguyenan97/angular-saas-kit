import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * The root: nothing but the router outlet. The routes put the suite's shell
 * around the pages (`app.routes.ts`).
 */
@Component({
  selector: 'ask-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}
