import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ThemeSwitcher,
} from '@angular-saas-kit/ui';

/**
 * Settings. For now, the appearance: the three theme axes, stored in this
 * browser by `ThemeService`.
 */
@Component({
  selector: 'ask-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    ThemeSwitcher,
  ],
  template: `
    <ask-card class="max-w-xl">
      <header askCardHeader>
        <h2 askCardTitle>Appearance</h2>
        <p askCardDescription>
          Mode, accent and corner radius. Each is a token swap on the page: no
          rebuild, and no component knows a colour value. Remembered in this
          browser.
        </p>
      </header>
      <div askCardContent>
        <ask-theme-switcher />
      </div>
    </ask-card>
  `,
})
export class Settings {}
