import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tab,
  Tabs,
  ThemeSwitcher,
} from '@angular-saas-kit/ui';

import { DEMO_DATA } from '../../demo-data';
import { NotificationSettingsForm } from './notification-settings';
import { ProfileSettings } from './profile-settings';

/**
 * Settings, in three tabs. The forms live in the tabs' content, which is
 * created with the page, so an edit survives a switch to another tab and
 * back.
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
    NotificationSettingsForm,
    ProfileSettings,
    Tab,
    Tabs,
    ThemeSwitcher,
  ],
  template: `
    <ask-tabs label="Settings" class="max-w-2xl" [(selectedIndex)]="tab">
      <ask-tab label="Profile">
        <ask-card>
          <header askCardHeader>
            <h2 askCardTitle>Profile</h2>
            <p askCardDescription>How you appear to the rest of your team.</p>
          </header>
          <div askCardContent>
            <ask-profile-settings />
          </div>
        </ask-card>
      </ask-tab>

      <ask-tab label="Notifications">
        <ask-card>
          <header askCardHeader>
            <h2 askCardTitle>Notifications</h2>
            <p askCardDescription>Which emails you get, and how often.</p>
          </header>
          <div askCardContent>
            <ask-notification-settings />
          </div>
        </ask-card>
      </ask-tab>

      <ask-tab label="Appearance">
        <ask-card>
          <header askCardHeader>
            <h2 askCardTitle>Appearance</h2>
            <p askCardDescription>
              Mode, accent and corner radius. Each is a token swap on the page:
              no rebuild, and no component knows a colour value. Remembered in
              this browser.
            </p>
          </header>
          <div askCardContent>
            <ask-theme-switcher />
          </div>
        </ask-card>
      </ask-tab>
    </ask-tabs>

    @if (demoData) {
      <p class="mt-4 max-w-2xl text-sm text-muted-foreground">
        Demo: saved changes last until the page is reloaded.
      </p>
    }
  `,
})
export class Settings {
  protected readonly tab = signal(0);
  protected readonly demoData = DEMO_DATA;
}
