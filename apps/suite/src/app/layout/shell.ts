import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  inject,
  linkedSignal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from '@angular-saas-kit/tokens';
import { map } from 'rxjs';

import { DEMO_DATA } from '../demo-data';
import { PageTitle } from '../page-title';

interface Module {
  readonly id: string;
  readonly name: string;
  /** Pages of a module that exists. A module still to come has none. */
  readonly pages: readonly { readonly label: string; readonly path: string }[];
}

/**
 * The business modules of order-to-cash. Booking is built; SCM, Logistics
 * and ERP are listed so the shape of the suite shows, and come with their
 * own specs.
 */
export const MODULES: readonly Module[] = [
  { id: 'suite', name: 'Suite', pages: [{ label: 'Overview', path: '/' }] },
  {
    id: 'booking',
    name: 'Booking',
    pages: [
      { label: 'Orders', path: '/booking/orders' },
      { label: 'New order', path: '/booking/orders/new' },
    ],
  },
  { id: 'scm', name: 'SCM', pages: [] },
  { id: 'logistics', name: 'Logistics', pages: [] },
  { id: 'erp', name: 'ERP', pages: [] },
];

/** Tailwind's `lg`: from here up the navigation is a sidebar. */
const DESKTOP_QUERY = '(min-width: 64rem)';

/**
 * The suite's frame: navigation grouped by module, a header with the page's
 * title and the theme, and the page. Below `lg` the navigation folds behind
 * a Menu button (a disclosure, not a modal drawer: it pushes the page down).
 */
@Component({
  selector: 'ask-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
})
export class Shell {
  protected readonly theme = inject(ThemeService);
  protected readonly pageTitle = inject(PageTitle).title;
  protected readonly demoData = DEMO_DATA;
  protected readonly modules = MODULES;

  protected readonly isDesktop = toSignal(
    inject(BreakpointObserver)
      .observe(DESKTOP_QUERY)
      .pipe(map((state) => state.matches)),
    { requireSync: true },
  );

  /** Phone: the navigation is unfolded. A change of layout folds it again. */
  protected readonly menuOpen = linkedSignal({
    source: this.isDesktop,
    computation: () => false,
  });

  private readonly content =
    viewChild.required<ElementRef<HTMLElement>>('content');

  /** Following a link folds the phone menu, so the page is in view. */
  protected navigated(): void {
    this.menuOpen.set(false);
  }

  /** The skip link moves focus itself: in the Pages build the hash is the route. */
  protected skipToContent(event: Event): void {
    event.preventDefault();
    this.content().nativeElement.focus();
  }
}
