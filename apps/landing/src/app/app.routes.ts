import type { Route, Routes } from '@angular/router';

import { POSTS, type Post } from './blog/posts';
import { Home } from './home';

const SITE = 'Angular SaaS Kit';

/**
 * A post's page, at a path of its own rather than `blog/:slug`: a static path
 * is prerendered without a list of parameters, and a slug with no post is
 * simply not a route, so it gets the 404 page.
 */
function postRoute(post: Post): Route {
  return {
    path: post.slug,
    title: `${post.title} — ${SITE}`,
    loadComponent: post.load,
    // Read by the page's ask-post-layout, from its ActivatedRoute.
    data: { post },
  };
}

// The home page is in the initial bundle; the blog is lazy.
export const appRoutes: Routes = [
  { path: '', title: SITE, component: Home },
  {
    path: 'blog',
    children: [
      {
        path: '',
        title: `Blog — ${SITE}`,
        loadComponent: () =>
          import('./blog/blog-index').then((m) => m.BlogIndex),
      },
      ...POSTS.map(postRoute),
    ],
  },
];
