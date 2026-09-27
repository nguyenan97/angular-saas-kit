import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  type TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { SEARCH_DEBOUNCE_MS, listQuery } from './list-query';
import type { Page } from './models';

interface Row {
  readonly id: string;
}

@Component({ changeDetection: ChangeDetectionStrategy.OnPush, template: '' })
class Host {
  readonly list = listQuery<Row>({
    url: '/api/rows',
    sort: { column: 'name', direction: 'asc' },
  });
}

const page = (n: number, total = 46): Page<Row> => ({
  items: [{ id: `row-${n}` }],
  total,
  page: n,
  pageSize: 10,
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  });
  const fixture = TestBed.createComponent(Host);
  const http = TestBed.inject(HttpTestingController);
  const list = fixture.componentInstance.list;
  /** Runs effects, then answers the one request the list has made. */
  const next = (): TestRequest => {
    TestBed.tick();
    return http.expectOne((req) => req.url === '/api/rows');
  };
  const params = (req: TestRequest) =>
    Object.fromEntries(
      req.request.params
        .keys()
        .map((key) => [key, req.request.params.get(key)]),
    );
  return { fixture, http, list, next, params };
}

afterEach(() => TestBed.inject(HttpTestingController).verify());

describe('listQuery', () => {
  it('asks for the first page in the default order', () => {
    const { next, params } = setup();

    expect(params(next())).toEqual({
      page: '1',
      pageSize: '10',
      sort: 'name',
      dir: 'asc',
    });
  });

  it('pages, and says which rows are shown', async () => {
    const { fixture, list, next, params } = setup();
    next().flush(page(1));
    await fixture.whenStable();
    expect(list.range()).toEqual({ first: 1, last: 10, total: 46 });

    list.page.set(5);
    const req = next();
    expect(params(req)['page']).toBe('5');
    req.flush(page(5));
    await fixture.whenStable();

    expect(list.range()).toEqual({ first: 41, last: 46, total: 46 });
  });

  it('keeps the last page on screen while the next one loads', async () => {
    const { fixture, list, next } = setup();
    next().flush(page(1));
    await fixture.whenStable();

    list.page.set(2);
    const pending = next();

    expect(list.resource.isLoading()).toBe(true);
    expect(list.current()?.items[0]?.id).toBe('row-1');
    pending.flush(page(2));
    await fixture.whenStable();
    expect(list.current()?.items[0]?.id).toBe('row-2');
  });

  it('goes back to page 1 when the sort or a filter changes', async () => {
    const { fixture, list, next, params } = setup();
    next().flush(page(1));
    list.page.set(3);
    next().flush(page(3));
    await fixture.whenStable();

    list.sort.set({ column: 'total', direction: 'desc' });
    const sorted = next();
    expect(params(sorted)).toMatchObject({
      page: '1',
      sort: 'total',
      dir: 'desc',
    });
    sorted.flush(page(1));

    list.filter('status', 'paid');
    const filtered = next();
    expect(params(filtered)).toMatchObject({ page: '1', status: 'paid' });
    filtered.flush(page(1));

    // An empty filter is left out of the request, not sent as "".
    list.filter('status', '');
    const cleared = next();
    expect(params(cleared)).not.toHaveProperty('status');
    cleared.flush(page(1));
  });

  it('waits for the typing to stop before it searches', async () => {
    const { fixture, http, list, next, params } = setup();
    next().flush(page(1));
    await fixture.whenStable();

    list.search.set('o');
    list.search.set('or');
    list.search.set('ord ');
    TestBed.tick();
    http.expectNone((req) => req.url === '/api/rows');

    await wait(SEARCH_DEBOUNCE_MS + 50);
    const searched = next();

    expect(params(searched)).toMatchObject({ q: 'ord', page: '1' });
    searched.flush(page(1, 3));
  });
});
