/**
 * Links from the landing page to the other things deployed next to it.
 *
 * The type lives in its own file, apart from the values, because the values
 * file is swapped for `site-links.pages.ts` by `fileReplacements`. A type
 * imported from the swapped file would resolve to its replacement.
 */
export interface SiteLinks {
  /** The dashboard demo. */
  readonly demo: string | null;
  /** The documentation site. */
  readonly docs: string | null;
  /** The components' Storybook. */
  readonly storybook: string | null;
}
