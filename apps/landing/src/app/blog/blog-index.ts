import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { POSTS, longDate } from './posts';

/** The blog's front page: every post, newest first. */
@Component({
  selector: 'ask-blog-index',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: { class: 'block' },
  template: `
    <div class="mx-auto max-w-3xl px-6 py-16">
      <h1 class="text-4xl font-semibold tracking-tight">Blog</h1>
      <p class="mt-3 text-pretty text-muted-foreground">
        News about the kit, and the reasoning behind it.
      </p>

      <ol
        role="list"
        class="mt-10 divide-y divide-border border-y border-border"
      >
        @for (post of posts; track post.slug) {
          <li class="py-6">
            <h2 class="text-xl font-semibold tracking-tight">
              <a
                class="rounded-sm underline-offset-4 hover:underline"
                [routerLink]="post.slug"
                >{{ post.title }}</a
              >
            </h2>
            <time
              class="mt-1 block text-sm text-muted-foreground"
              [attr.datetime]="post.date"
              >{{ longDate(post.date) }}</time
            >
            <p class="mt-3 text-pretty text-muted-foreground">
              {{ post.summary }}
            </p>
          </li>
        }
      </ol>
    </div>
  `,
})
export class BlogIndex {
  protected readonly posts = POSTS;
  protected readonly longDate = longDate;
}
