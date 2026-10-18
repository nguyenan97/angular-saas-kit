import type { NextFunction, Request, Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { cacheControlFor, serverErrors } from './server-responses';

interface Answer {
  status: number;
  headers: Map<string, string>;
  body: string;
  next: NextFunction;
}

function fail(error: unknown, headersSent = false): Answer {
  const answer: Answer = {
    status: 200,
    headers: new Map(),
    body: '',
    next: vi.fn(),
  };
  const res = {
    headersSent,
    set statusCode(code: number) {
      answer.status = code;
    },
    setHeader: (name: string, value: string) => answer.headers.set(name, value),
    end: (body: string) => {
      answer.body = body;
    },
  } as unknown as Response;
  serverErrors(error, {} as Request, res, answer.next);
  return answer;
}

describe('serverErrors', () => {
  afterEach(() => vi.restoreAllMocks());

  it('answers a malformed URL with 400, not 500', () => {
    const answer = fail(new URIError('URI malformed'));

    expect(answer.status).toBe(400);
    expect(answer.body).toBe('Bad request');
  });

  it('answers an unexpected error with 500 and never sends its stack', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new Error('database password is hunter2');

    const answer = fail(error);

    expect(answer.status).toBe(500);
    expect(answer.body).toBe('Server error');
    expect(answer.body).not.toContain('hunter2');
    expect(answer.body).not.toContain('at ');
    expect(answer.headers.get('Content-Type')).toBe(
      'text/plain; charset=utf-8',
    );
  });

  it('logs an unexpected error on the server', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new Error('boom');

    fail(error);

    expect(log).toHaveBeenCalledWith(error);
  });

  it('keeps the status of a client error it is given', () => {
    const answer = fail(Object.assign(new Error('too big'), { status: 413 }));

    expect(answer.status).toBe(413);
    expect(answer.body).toBe('Bad request');
  });

  it('hands an error after the headers went out back to Express', () => {
    const error = new Error('late');

    const answer = fail(error, true);

    expect(answer.next).toHaveBeenCalledWith(error);
    expect(answer.body).toBe('');
  });
});

describe('cacheControlFor', () => {
  it('keeps a hashed bundle for a year, unchanged', () => {
    expect(cacheControlFor('/dist/browser/chunk-C7wytggW.js')).toBe(
      'public, max-age=31536000, immutable',
    );
    expect(cacheControlFor('/dist/browser/main-FXXCS33N.js')).toBe(
      'public, max-age=31536000, immutable',
    );
    expect(cacheControlFor('/dist/browser/styles-W3ASZ43O.css')).toBe(
      'public, max-age=31536000, immutable',
    );
  });

  it('has a page or an unhashed file checked again on every visit', () => {
    for (const file of [
      '/dist/browser/index.html',
      '/dist/browser/index.csr.html',
      '/dist/browser/blog/index.html',
      '/dist/browser/favicon.ico',
      '/dist/browser/404.html',
    ]) {
      expect(cacheControlFor(file)).toBe('no-cache');
    }
  });

  it('reads Windows paths the same way', () => {
    expect(cacheControlFor('D:\\dist\\browser\\chunk-C7wytggW.js')).toBe(
      'public, max-age=31536000, immutable',
    );
  });
});
