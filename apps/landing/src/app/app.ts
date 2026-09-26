import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '@angular-saas-kit/tokens';
import { SITE_LINKS } from './site-links';

@Component({
  selector: 'ask-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  protected readonly theme = inject(ThemeService);

  protected readonly links = SITE_LINKS;

  protected readonly year = new Date().getFullYear();
}
