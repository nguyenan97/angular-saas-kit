import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from '@angular-saas-kit/tokens';
import { ThemeSwitcher } from '@angular-saas-kit/ui';

interface NavItem {
  readonly label: string;
  readonly path: string;
  /** Marks pages that are scaffolded but not built yet. */
  readonly soon?: boolean;
}

@Component({
  selector: 'ask-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ThemeSwitcher],
  templateUrl: './app.html',
})
export class App {
  protected readonly theme = inject(ThemeService);

  /** Collapsed rail on desktop; the same signal drives the mobile drawer. */
  protected readonly sidebarOpen = signal(true);

  protected readonly nav: readonly NavItem[] = [
    { label: 'Overview', path: '/' },
    { label: 'Analytics', path: '/analytics', soon: true },
    { label: 'Orders', path: '/orders', soon: true },
    { label: 'Customers', path: '/customers', soon: true },
    { label: 'Products', path: '/products', soon: true },
    { label: 'Settings', path: '/settings', soon: true },
  ];

  protected toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }
}
