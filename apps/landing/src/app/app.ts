import {
  ChangeDetectionStrategy,
  Component,
  VERSION,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { ThemeService } from '@angular-saas-kit/tokens';
import { Button } from '@angular-saas-kit/ui';
import { filter, map } from 'rxjs';

// RouterLinkActive is not used: its content query would put the query runtime
// in the initial bundle for one aria-current, which a signal gives for free.
@Component({
  selector: 'ask-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, RouterLink, RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  protected readonly theme = inject(ThemeService);

  private readonly router = inject(Router);

  /**
   * The home page's sections, linked from the header by their ids. A link is a
   * bare fragment, which resolves against the base href, so from any page it
   * leads to the section on the home page.
   */
  protected readonly sections = [
    { id: 'features', label: 'Features' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'faq', label: 'FAQ' },
  ] as const;

  /** The current page, relative to the base href: `''` is home, `blog` the blog. */
  private readonly page = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => pagePath(this.router.url)),
    ),
    { initialValue: '' },
  );

  /**
   * The skip link's target on the current page. A bare `#main-content` would
   * also resolve against the base href and lead to the home page, so the link
   * names the page. It is rendered into the prerendered HTML, so it works
   * before the page hydrates.
   */
  protected readonly skipLink = computed(() => `${this.page()}#main-content`);

  /** The header's blog link is the current page on the blog's index. */
  protected readonly onBlogIndex = computed(() => this.page() === 'blog');

  /** The major version of the Angular the page was built with. */
  protected readonly angularVersion = VERSION.major;
}

/** A router URL as a path relative to the base href: `/blog?x#y` is `blog`. */
function pagePath(url: string): string {
  return (url.split(/[?#]/)[0] ?? '').replace(/^\//, '');
}
