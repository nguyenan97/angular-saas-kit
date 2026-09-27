import { httpResource } from '@angular/common/http';
import {
  type Signal,
  computed,
  effect,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import type { Sort } from '@angular-saas-kit/ui';

import type { Page } from './models';

/** How long the search box waits for the typing to stop before it asks. */
export const SEARCH_DEBOUNCE_MS = 300;

/** A signal that takes `source`'s value once it has stopped changing for `ms`. */
function settled<T>(source: Signal<T>, ms: number): Signal<T> {
  const value = signal(untracked(source));
  effect((onCleanup) => {
    const next = source();
    const timer = setTimeout(() => value.set(next), ms);
    onCleanup(() => clearTimeout(timer));
  });
  return value.asReadonly();
}

export interface ListQueryOptions {
  /** The list's endpoint, such as `/api/orders`. */
  readonly url: string;
  /** The order the list opens in. */
  readonly sort: Sort;
  readonly pageSize?: number;
}

/**
 * A searchable, sortable, paged list from the API: its state as signals, and
 * the request that follows them.
 *
 * The page binds its search box, filters, sort headers and pagination to
 * these; there is nothing to subscribe to. A new search, filter or sort goes
 * back to page 1. Create it in a field initializer: it needs an injection
 * context.
 */
export function listQuery<T>(options: ListQueryOptions) {
  const pageSize = options.pageSize ?? 10;
  const search = signal('');
  const filters = signal<Readonly<Record<string, string>>>({});
  const sort = signal<Sort | null>(options.sort);
  const query = settled(search, SEARCH_DEBOUNCE_MS);

  const page = linkedSignal({
    source: () => [query(), filters(), sort()] as const,
    computation: () => 1,
  });

  const resource = httpResource<Page<T>>(() => {
    const order = sort();
    const params: Record<string, string | number> = {
      page: page(),
      pageSize,
    };
    const q = query().trim();
    if (q) {
      params['q'] = q;
    }
    if (order) {
      params['sort'] = order.column;
      params['dir'] = order.direction;
    }
    for (const [name, value] of Object.entries(filters())) {
      if (value) {
        params[name] = value;
      }
    }
    return { url: options.url, params };
  });

  // The last page that arrived. Kept while the next one loads, so the table
  // dims instead of flashing empty between pages. An effect rather than a
  // linkedSignal: a linkedSignal computes only when read, so a page nobody
  // had read yet would be forgotten the moment the next one started loading.
  const current = signal<Page<T> | undefined>(undefined);
  effect(() => {
    if (resource.hasValue()) {
      current.set(resource.value());
    }
  });

  /** "Showing 11 to 20 of 46", or undefined before the first answer. */
  const range = computed(() => {
    const shown = current();
    if (!shown) {
      return undefined;
    }
    const first = shown.total === 0 ? 0 : (shown.page - 1) * shown.pageSize + 1;
    return {
      first,
      last: Math.min(shown.page * shown.pageSize, shown.total),
      total: shown.total,
    };
  });

  return {
    search,
    filters,
    sort,
    page,
    pageSize,
    resource,
    current: current.asReadonly(),
    range,
    /** Sets one filter, or clears it with an empty string. */
    filter(name: string, value: string): void {
      filters.update((all) => ({ ...all, [name]: value }));
    },
  };
}

export type ListQuery<T> = ReturnType<typeof listQuery<T>>;
