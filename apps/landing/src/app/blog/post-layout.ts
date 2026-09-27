import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { type Post, longDate } from './posts';

/**
 * How an article's own markup looks: headings, paragraphs, lists, links and
 * code, styled from here so that a post is plain HTML.
 */
const PROSE = [
  'mt-10',
  '[&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight',
  '[&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold',
  '[&_p]:mt-4 [&_p]:leading-7',
  '[&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-2 [&_li]:leading-7',
  '[&_a]:rounded-sm [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4',
  '[&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm',
  '[&_pre]:mt-4 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted [&_pre]:p-4',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
].join(' ');

/**
 * The frame of a post's page: a way back to the index, the title as the
 * page's one h1, the date, and the article, projected and styled.
 *
 * ```html
 * <ask-post-layout>
 *   <p>The article, in plain HTML.</p>
 * </ask-post-layout>
 * ```
 *
 * It takes the post from its route's data (`app.routes.ts`), so an article
 * names nothing about itself. Router input binding would do the same, at the
 * cost of its code in the initial bundle.
 */
@Component({
  selector: 'ask-post-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: { class: 'block' },
  template: `
    <article class="mx-auto max-w-3xl px-6 py-16">
      <a
        routerLink="/blog"
        class="rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline"
        >All posts</a
      >
      <h1 class="mt-6 text-4xl font-semibold tracking-tight text-balance">
        {{ post.title }}
      </h1>
      <time
        class="mt-3 block text-sm text-muted-foreground"
        [attr.datetime]="post.date"
        >{{ date }}</time
      >

      <div [class]="prose">
        <ng-content />
      </div>
    </article>
  `,
})
export class PostLayout {
  protected readonly post: Post = inject(ActivatedRoute).snapshot.data['post'];

  protected readonly date = longDate(this.post.date);
  protected readonly prose = PROSE;
}
