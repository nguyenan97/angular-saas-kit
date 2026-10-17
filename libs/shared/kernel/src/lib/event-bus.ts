import type { DomainEvent } from './domain-event';

type Handler<E> = (event: E) => void;

/**
 * Delivers domain events synchronously, in memory, in subscription order.
 *
 * The suite's mock backend owns one; a real system would put a broker here.
 */
export class InMemoryEventBus<E extends DomainEvent> {
  private readonly handlers = new Map<string, Handler<E>[]>();
  private readonly allHandlers: Handler<E>[] = [];

  subscribe<T extends E['type']>(
    type: T,
    handler: Handler<Extract<E, { type: T }>>,
  ): () => void {
    const list = this.handlers.get(type) ?? [];
    const entry = handler as Handler<E>;
    list.push(entry);
    this.handlers.set(type, list);
    return () => list.splice(list.indexOf(entry), 1);
  }

  subscribeAll(handler: Handler<E>): () => void {
    this.allHandlers.push(handler);
    return () => this.allHandlers.splice(this.allHandlers.indexOf(handler), 1);
  }

  publish(event: E): void {
    for (const handler of [...(this.handlers.get(event.type) ?? [])]) {
      handler(event);
    }
    for (const handler of [...this.allHandlers]) handler(event);
  }
}
