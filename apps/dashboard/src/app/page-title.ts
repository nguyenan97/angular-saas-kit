import { Injectable, type Provider, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { type RouterStateSnapshot, TitleStrategy } from '@angular/router';

const APP_NAME = 'Angular SaaS Kit';

/**
 * Keeps the topbar heading and the document title in step with the route.
 *
 * Every route declares a `title`. The router calls `updateTitle` after each
 * navigation, so the heading can never name a page other than the one shown.
 */
@Injectable({ providedIn: 'root' })
export class PageTitle extends TitleStrategy {
  private readonly documentTitle = inject(Title);
  private readonly current = signal('');

  /** The title of the page on screen; empty before the first navigation. */
  readonly title = this.current.asReadonly();

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot) ?? '';
    this.current.set(title);
    this.documentTitle.setTitle(title ? `${title} — ${APP_NAME}` : APP_NAME);
  }
}

/** Makes the router report titles to `PageTitle` instead of its default strategy. */
export function providePageTitle(): Provider {
  return { provide: TitleStrategy, useExisting: PageTitle };
}
