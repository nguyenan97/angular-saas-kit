import type { FocusTrap } from '@angular/cdk/a11y';
import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from '@angular-saas-kit/tokens';
import { map } from 'rxjs';

import { DEMO_DATA } from './demo-data';
import { PageTitle } from './page-title';

interface NavItem {
  readonly label: string;
  readonly path: string;
  /** Marks pages that are planned but not built yet. They render as text, not as links. */
  readonly soon?: boolean;
}

/**
 * Tailwind's `lg` breakpoint. From here up the sidebar is a rail beside the
 * content; below it, a drawer over the content.
 */
export const DESKTOP_QUERY = '(min-width: 64rem)';

@Component({
  selector: 'ask-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  // Escape closes the open drawer from anywhere, as it would a dialog.
  host: { '(document:keydown.escape)': 'closeDrawer()' },
})
export class App {
  protected readonly theme = inject(ThemeService);
  protected readonly pageTitle = inject(PageTitle).title;
  protected readonly demoData = DEMO_DATA;
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  // The observer emits on subscribe, so the first render already has the
  // right layout instead of flashing the mobile one on a desktop.
  protected readonly isDesktop = toSignal(
    inject(BreakpointObserver)
      .observe(DESKTOP_QUERY)
      .pipe(map((state) => state.matches)),
    { requireSync: true },
  );

  /** Desktop: the rail shows its labels, or collapses to its icons. */
  protected readonly expanded = signal(true);

  /** Mobile: the drawer is open. Any switch of layout closes it again. */
  protected readonly drawerOpen = linkedSignal({
    source: this.isDesktop,
    computation: () => false,
  });

  /** The open drawer is modal: the content column is inert behind it. */
  protected readonly drawerVisible = computed(
    () => !this.isDesktop() && this.drawerOpen(),
  );

  /** What the menu button reports as `aria-expanded`, in either layout. */
  protected readonly sidebarShown = computed(() =>
    this.isDesktop() ? this.expanded() : this.drawerOpen(),
  );

  /** Only the collapsed rail hides its labels, and then only visually. */
  protected readonly labelsVisible = computed(
    () => !this.isDesktop() || this.expanded(),
  );

  protected readonly nav: readonly NavItem[] = [
    { label: 'Overview', path: '/' },
    { label: 'Analytics', path: '/analytics' },
    { label: 'Orders', path: '/orders' },
    { label: 'Customers', path: '/customers' },
    { label: 'Products', path: '/products' },
    { label: 'Settings', path: '/settings' },
  ];

  private readonly sidebar =
    viewChild.required<ElementRef<HTMLElement>>('sidebar');
  private readonly menuButton =
    viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');
  private readonly content =
    viewChild.required<ElementRef<HTMLElement>>('content');

  private focusTrap: FocusTrap | undefined;

  constructor() {
    // The open drawer traps focus. The CDK's focus trap is loaded when the
    // drawer first opens: imported statically, @angular/cdk/a11y would sit in
    // the initial bundle, and with it every part of that module the lazy
    // pages use (the menus' and dialogs' key managers), about 19 kB.
    effect(() => {
      if (this.drawerVisible()) {
        void this.trapFocus();
      } else {
        this.focusTrap?.destroy();
        this.focusTrap = undefined;
      }
    });
  }

  protected toggleSidebar(): void {
    if (this.isDesktop()) {
      this.expanded.update((expanded) => !expanded);
    } else {
      this.drawerOpen.update((open) => !open);
    }
  }

  /** Closes the drawer and hands focus back to the button that opened it. */
  protected closeDrawer(): void {
    if (!this.drawerVisible()) {
      return;
    }

    this.drawerOpen.set(false);
    // The button is in the content column, which stays inert until the next
    // render. Focusing it any earlier would silently do nothing.
    afterNextRender(() => this.menuButton().nativeElement.focus(), {
      injector: this.injector,
    });
  }

  /** Holds Tab inside the drawer and moves focus into it, once the trap has loaded. */
  private async trapFocus(): Promise<void> {
    const { FocusTrapFactory } = await import('@angular/cdk/a11y');
    // The drawer may have closed, or the shell gone, while the module loaded.
    if (this.destroyRef.destroyed || !this.drawerVisible() || this.focusTrap) {
      return;
    }
    this.focusTrap = this.injector
      .get(FocusTrapFactory)
      .create(this.sidebar().nativeElement, true);
    this.focusTrap.attachAnchors();
    await this.focusTrap.focusInitialElementWhenReady();
  }

  /**
   * The skip link moves focus itself. Following its href would change the
   * route in the Pages build, where the hash is the route.
   */
  protected skipToContent(event: Event): void {
    event.preventDefault();
    this.content().nativeElement.focus();
  }
}
