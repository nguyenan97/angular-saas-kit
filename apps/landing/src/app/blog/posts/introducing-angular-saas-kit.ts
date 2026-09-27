import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PostLayout } from '../post-layout';

/**
 * The first post. Its article is plain HTML inside the layout, which styles
 * it. Everything it says is true of the code on the day it is dated.
 */
@Component({
  selector: 'ask-post-introducing-angular-saas-kit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PostLayout],
  template: `
    <ask-post-layout>
      <p>
        Angular SaaS Kit is a free, MIT-licensed starting point for a
        software-as-a-service product in Angular 22: an admin dashboard and a
        landing page, built on one design system. The code is on GitHub, the
        dashboard runs as a live demo, and the documentation explains how it
        works and why.
      </p>

      <h2>What is in it</h2>
      <ul>
        <li>
          A dashboard with overview, analytics, orders, customers, products and
          settings pages, and sign-in, sign-up and password reset forms. Its
          data comes from an in-memory API that you replace with your own.
        </li>
        <li>
          A landing page, prerendered, whose features, pricing and questions are
          components you edit.
        </li>
        <li>
          Design tokens for light and dark mode, four accents and four corner
          radii, switched by three attributes on the html element.
        </li>
        <li>
          Components on the Angular CDK and Tailwind v4: Button, Card, Table,
          Dialog, Menu, Tabs, Chart and a few more.
        </li>
      </ul>

      <h2>How it is built</h2>
      <p>
        There is no zone.js. State lives in signals, every component uses OnPush
        change detection, and the dashboard loads its data with httpResource.
      </p>
      <p>
        Components never name a colour. They use semantic tokens such as
        <code>bg-card</code> and <code>text-muted-foreground</code>, so a new
        brand is a change of tokens, and the dashboard and the landing page
        follow it together.
      </p>
      <p>
        Accessibility is checked rather than hoped for: template accessibility
        rules fail the lint, browser tests drive the menus, dialogs and forms
        from the keyboard, and a test holds the colour tokens to WCAG contrast
        in both modes and every accent.
      </p>
      <p>
        The decisions are written down as architecture decision records, and CI
        checks that the architecture diagrams still match the code.
      </p>

      <h2>What is not there yet</h2>
      <p>
        The components are not on npm yet: clone the repository and keep what
        you need. The library is small, not the forty components the roadmap
        plans. There is no backend and no real authentication: the sign-in pages
        are forms, ready to call your own provider.
      </p>

      <h2>Try it</h2>
      <p>
        Open the
        <a href="https://nguyenan97.github.io/angular-saas-kit/demo/"
          >live demo</a
        >, read the
        <a href="https://nguyenan97.github.io/angular-saas-kit/docs/"
          >documentation</a
        >, or clone the
        <a href="https://github.com/nguyenan97/angular-saas-kit">repository</a>
        and run it with Node 22 and npm 11 or later:
      </p>
      <pre tabindex="0"><code>npm ci
npm start</code></pre>
      <p>
        The kit is early, so what people ask for shapes what comes next.
        <a href="https://github.com/nguyenan97/angular-saas-kit/issues"
          >Open an issue</a
        >
        to say what you need.
      </p>
    </ask-post-layout>
  `,
})
export class IntroducingAngularSaasKit {}
