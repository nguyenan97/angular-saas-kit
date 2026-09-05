import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '@angular-saas-kit/tokens';

@Component({
  selector: 'ask-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  protected readonly theme = inject(ThemeService);

  protected readonly year = new Date().getFullYear();
}
