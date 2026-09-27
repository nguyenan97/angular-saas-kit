import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type DefaultTheme } from 'vitepress';

const REPO = 'https://github.com/nguyenan97/angular-saas-kit';
const SITE = 'https://nguyenan97.github.io/angular-saas-kit';

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(docsRoot, '..');

// The brand mark the apps use: a rounded square in the default accent.
const MARK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23155dfc'/%3E%3C/svg%3E";

/** One sidebar entry per ADR, read from each file's first heading. */
function adrItems(): DefaultTheme.SidebarItem[] {
  const dir = join(docsRoot, 'adr');
  return readdirSync(dir)
    .filter((name) => /^\d{4}-.+\.md$/.test(name))
    .sort()
    .map((name) => {
      const heading = /^#\s+(.+)$/m.exec(readFileSync(join(dir, name), 'utf8'));
      return {
        text: heading?.[1] ?? name,
        link: `/adr/${name.replace(/\.md$/, '')}`,
      };
    });
}

const NOT_A_PAGE_LINK = /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i;

/**
 * Pages are written to read on GitHub, where `../../libs/x.ts` is a link to a
 * file. On the site those paths lead nowhere, so a relative link that does not
 * reach a published page (a source file, a folder, the site's own config, a
 * document in docs/superpowers) is pointed at the file on GitHub instead, and a
 * link to a folder's README.md is pointed at that folder's index page.
 */
function rewriteHref(href: string, source: string): string {
  if (NOT_A_PAGE_LINK.test(href)) return href;

  const hashAt = href.indexOf('#');
  const path = hashAt === -1 ? href : href.slice(0, hashAt);
  const hash = hashAt === -1 ? '' : href.slice(hashAt);

  const target = resolve(dirname(source), path);
  const fromDocs = relative(docsRoot, target).split(sep).join('/');

  // Only Markdown inside docs is published, apart from the working documents
  // in docs/superpowers and the site's own configuration.
  const published =
    !fromDocs.startsWith('..') &&
    !fromDocs.startsWith('superpowers') &&
    !fromDocs.startsWith('.vitepress') &&
    fromDocs.endsWith('.md');

  if (!published) {
    const inRepo = posix.normalize(
      relative(repoRoot, target).split(sep).join('/'),
    );
    const kind =
      existsSync(target) && statSync(target).isDirectory() ? 'tree' : 'blob';
    return `${REPO}/${kind}/main/${inRepo}${hash}`;
  }

  return `${path.replace(/README\.md$/, 'index.md')}${hash}`;
}

export default defineConfig({
  title: 'Angular SaaS Kit',
  description:
    'A free admin dashboard and landing page for Angular. Zoneless, signals-first, Tailwind v4, on a token-driven design system.',
  lang: 'en-US',
  base: '/angular-saas-kit/docs/',

  srcExclude: ['superpowers/**', 'README.md'],
  // GitHub shows a folder's README.md; the site wants an index page.
  rewrites: { ':dir/README.md': ':dir/index.md' },

  sitemap: { hostname: `${SITE}/docs/` },

  vite: {
    // Mermaid's core chunk is about 650 kB. It loads on demand, and only on
    // pages that have a diagram, so the default 500 kB warning is just noise.
    build: { chunkSizeWarningLimit: 700 },
  },

  head: [
    ['link', { rel: 'icon', href: MARK }],
    ['meta', { name: 'theme-color', content: '#155dfc' }],
  ],

  markdown: {
    config(md) {
      // ```mermaid blocks become a component that draws them in the browser.
      const fence = md.renderer.rules.fence;
      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        if (token?.info.trim() === 'mermaid') {
          return `<Mermaid code="${encodeURIComponent(token.content)}" />\n`;
        }
        return fence
          ? fence(tokens, idx, options, env, self)
          : self.renderToken(tokens, idx, options);
      };

      md.core.ruler.push('repo-links', (state) => {
        const source = state.env['path'] as string | undefined;
        if (!source) return;
        for (const block of state.tokens) {
          for (const token of block.children ?? []) {
            if (token.type !== 'link_open') continue;
            const href = token.attrGet('href');
            if (href) token.attrSet('href', rewriteHref(href, source));
          }
        }
      });
    },
  },

  themeConfig: {
    logo: { src: MARK, alt: '' },
    siteTitle: 'Angular SaaS Kit',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Architecture', link: '/architecture/' },
      { text: 'Decisions', link: '/adr/' },
      { text: 'Reference', link: '/reference/scripts' },
      { text: 'Live demo', link: `${SITE}/demo/` },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting started', link: '/guide/getting-started' },
          { text: 'Theming', link: '/guide/theming' },
          { text: 'Components', link: '/guide/components' },
          { text: 'Mock API', link: '/guide/mock-api' },
          { text: 'The landing page', link: '/guide/landing-page' },
          { text: 'Testing', link: '/guide/testing' },
          { text: 'Deploying', link: '/guide/deploying' },
          { text: 'Continuous integration', link: '/guide/ci' },
        ],
      },
      {
        text: 'Architecture',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/architecture/' },
          { text: '1. System context', link: '/architecture/c4-context' },
          { text: '2. Containers', link: '/architecture/c4-containers' },
          { text: '3. Components', link: '/architecture/c4-components' },
          { text: 'Deployment', link: '/architecture/c4-deployment' },
        ],
      },
      {
        text: 'Decisions',
        collapsed: true,
        items: [
          { text: 'Index', link: '/adr/' },
          ...adrItems(),
          { text: 'Template', link: '/adr/template' },
        ],
      },
      {
        text: 'Reference',
        collapsed: true,
        items: [
          { text: 'Scripts and targets', link: '/reference/scripts' },
          { text: 'Workspace layout', link: '/reference/workspace' },
        ],
      },
      {
        text: 'Project',
        collapsed: true,
        items: [
          { text: 'Contributing', link: `${REPO}/blob/main/CONTRIBUTING.md` },
          { text: 'Security policy', link: `${REPO}/blob/main/SECURITY.md` },
          {
            text: 'Code of conduct',
            link: `${REPO}/blob/main/CODE_OF_CONDUCT.md`,
          },
          { text: 'License (MIT)', link: `${REPO}/blob/main/LICENSE` },
        ],
      },
    ],

    socialLinks: [{ icon: 'github', link: REPO }],
    search: { provider: 'local' },
    outline: { level: [2, 3] },
    editLink: {
      pattern: `${REPO}/edit/main/docs/:path`,
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Nguyen An',
    },
  },
});
