---
layout: home
title: Angular SaaS Kit

hero:
  name: Angular SaaS Kit
  text: A free admin dashboard and landing page for Angular
  tagline: Signals-first components on a token-driven design system. No UI library to fight, no theme to reverse-engineer - swap an attribute and the whole kit reskins.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Live demo
      link: https://nguyenan97.github.io/angular-saas-kit/demo/
    - theme: alt
      text: Storybook
      link: https://nguyenan97.github.io/angular-saas-kit/storybook/
    - theme: alt
      text: View on GitHub
      link: https://github.com/nguyenan97/angular-saas-kit

features:
  - title: Theming without a rebuild
    details: Three attributes on the html element - mode, accent and radius - restyle the whole kit at runtime. Components never name a colour.
    link: /guide/theming
    linkText: How theming works
  - title: Zoneless and signals-first
    details: No zone.js anywhere. State is signals, and every component is OnPush.
    link: /adr/0003-zoneless-signals-first-onpush-components
    linkText: Why
  - title: No UI library to fight
    details: Built on Tailwind and, when a component needs one, the Angular CDK. You own the markup.
    link: /adr/0005-angular-cdk-and-tailwind-instead-of-a-ui-library
    linkText: Why
  - title: One design system, two apps
    details: The dashboard and the landing page share one set of tokens, so the marketing site and the product look like the same thing.
    link: /reference/workspace
    linkText: Workspace layout
  - title: Architecture you can read
    details: C4 diagrams and architecture decision records, with a CI check that keeps the container map true to the code.
    link: /architecture/
    linkText: See the diagrams
  - title: A pipeline that guards main
    details: Required checks, CodeQL, Dependabot, secret scanning and a demo deployed from main, tuned so it does not burn CI minutes.
    link: /guide/ci
    linkText: How CI works
---

<div class="vp-doc" style="max-width: 688px; margin: 48px auto 0; padding: 0 24px;">

## Status: early

The design system, both apps, the CI gates and this documentation are in place.
The component library and the remaining dashboard pages are being built in the
open. These docs describe what exists today, and say so when something is
planned but not built yet: a component list that is longer than the code helps
nobody.

Stars and issues at this stage genuinely shape what gets built first. See the
[roadmap](https://github.com/nguyenan97/angular-saas-kit#roadmap) and
[how to contribute](https://github.com/nguyenan97/angular-saas-kit/blob/main/CONTRIBUTING.md).

</div>
