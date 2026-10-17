import type { DomainEvent } from './domain-event';

type Handler<E> = (event: E) => void;

function remove<T>(list: T[], item: T): void {
  const index = list.indexOf(item);
  if (index >= 0) list.splice(index, 1);
}

/**
 * Delivers domain events synchronously, in memory.
 *
 * Order: the subscribers of the event's type first, then the `subscribeAll`
 * subscribers, each group in subscription order. A handler unsubscribed while an
 * event is being delivered still receives that one event.
 *
 * A `publish` made from inside a handler is queued, not run at once: each event
 * reaches every handler before the next one starts. The outermost `publish` drains
 * the queue, and an error thrown by any handler propagates to its caller, which
 * discards the events still queued.
 *
 * The suite's mock backend owns one; a real system would put a broker here.
 */
export class InMemoryEventBus<E extends DomainEvent> {
  private readonly handlers = new Map<string, Handler<E>[]>();
  private readonly allHandlers: Handler<E>[] = [];
  private readonly queue: E[] = [];
  private delivering = false;

  subscribe<T extends E['type']>(
    type: T,
    handler: Handler<Extract<E, { type: T }>>,
  ): () => void {
    const list = this.handlers.get(type) ?? [];
    const entry = handler as Handler<E>;
    list.push(entry);
    this.handlers.set(type, list);
    return () => remove(list, entry);
  }

  subscribeAll(handler: Handler<E>): () => void {
    this.allHandlers.push(handler);
    return () => remove(this.allHandlers, handler);
  }

  publish(event: E): void {
    this.queue.push(event);
    if (this.delivering) return;
    this.delivering = true;
    try {
      let next: E | undefined;
      while ((next = this.queue.shift()) !== undefined) this.deliver(next);
    } finally {
      this.delivering = false;
      this.queue.length = 0;
    }
  }

  private deliver(event: E): void {
    for (const handler of [...(this.handlers.get(event.type) ?? [])]) {
      handler(event);
    }
    for (const handler of [...this.allHandlers]) handler(event);
  }
}
