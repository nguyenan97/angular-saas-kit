import {
  ChangeDetectionStrategy,
  Component,
  VERSION,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '@angular-saas-kit/tokens';
import { Button } from '@angular-saas-kit/ui';
import { Faq } from './sections/faq';
import { Features } from './sections/features';
import { Pricing } from './sections/pricing';
import { SITE_LINKS } from './site-links';

@Component({
  selector: 'ask-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Faq, Features, Pricing, RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  protected readonly theme = inject(ThemeService);

  protected readonly links = SITE_LINKS;

  /** The page's sections, linked from the header by their ids. */
  protected readonly sections = [
    { id: 'features', label: 'Features' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'faq', label: 'FAQ' },
  ] as const;

  /** The major version of the Angular the page was built with. */
  protected readonly angularVersion = VERSION.major;
}
