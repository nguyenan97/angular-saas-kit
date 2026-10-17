import { describe, expect, it } from 'vitest';
import { domainEvent, type DomainEvent } from './domain-event';
import { InMemoryEventBus } from './event-bus';

type Pinged = DomainEvent<'Pinged', { n: number }>;
type Ponged = DomainEvent<'Ponged', { n: number }>;

const at = new Date('2026-10-17T08:00:00Z');

describe('domainEvent', () => {
  it('stamps the type, the time and the payload', () => {
    expect(domainEvent('Pinged', { n: 1 }, at)).toEqual({
      type: 'Pinged',
      occurredAt: '2026-10-17T08:00:00.000Z',
      payload: { n: 1 },
    });
  });
});

describe('InMemoryEventBus', () => {
  it('delivers an event to the subscribers of its type only', () => {
    const bus = new InMemoryEventBus<Pinged | Ponged>();
    const pinged: number[] = [];
    const ponged: number[] = [];
    bus.subscribe('Pinged', (event) => pinged.push(event.payload.n));
    bus.subscribe('Ponged', (event) => ponged.push(event.payload.n));

    bus.publish(domainEvent('Pinged', { n: 1 }, at));

    expect(pinged).toEqual([1]);
    expect(ponged).toEqual([]);
  });

  it('delivers to every subscriber in subscription order', () => {
    const bus = new InMemoryEventBus<Pinged>();
    const calls: string[] = [];
    bus.subscribe('Pinged', () => calls.push('first'));
    bus.subscribe('Pinged', () => calls.push('second'));

    bus.publish(domainEvent('Pinged', { n: 1 }, at));

    expect(calls).toEqual(['first', 'second']);
  });

  it('stops delivering after unsubscribe', () => {
    const bus = new InMemoryEventBus<Pinged>();
    const seen: number[] = [];
    const unsubscribe = bus.subscribe('Pinged', (e) => seen.push(e.payload.n));

    unsubscribe();
    bus.publish(domainEvent('Pinged', { n: 1 }, at));

    expect(seen).toEqual([]);
  });

  it('delivers to subscribers of every type through subscribeAll', () => {
    const bus = new InMemoryEventBus<Pinged | Ponged>();
    const seen: string[] = [];
    bus.subscribeAll((event) => seen.push(event.type));

    bus.publish(domainEvent('Pinged', { n: 1 }, at));
    bus.publish(domainEvent('Ponged', { n: 2 }, at));

    expect(seen).toEqual(['Pinged', 'Ponged']);
  });

  it('survives an unsubscribe called twice', () => {
    const bus = new InMemoryEventBus<Pinged>();
    const calls: string[] = [];
    const unsubscribeA = bus.subscribe('Pinged', () => calls.push('a'));
    bus.subscribe('Pinged', () => calls.push('b'));

    unsubscribeA();
    unsubscribeA();
    bus.publish(domainEvent('Pinged', { n: 1 }, at));

    expect(calls).toEqual(['b']);
  });

  it('survives a subscribeAll unsubscribe called twice', () => {
    const bus = new InMemoryEventBus<Pinged>();
    const calls: string[] = [];
    const unsubscribeA = bus.subscribeAll(() => calls.push('a'));
    bus.subscribeAll(() => calls.push('b'));

    unsubscribeA();
    unsubscribeA();
    bus.publish(domainEvent('Pinged', { n: 1 }, at));

    expect(calls).toEqual(['b']);
  });

  it('delivers type subscribers before subscribeAll subscribers', () => {
    const bus = new InMemoryEventBus<Pinged>();
    const calls: string[] = [];
    bus.subscribeAll(() => calls.push('all'));
    bus.subscribe('Pinged', () => calls.push('type'));

    bus.publish(domainEvent('Pinged', { n: 1 }, at));

    expect(calls).toEqual(['type', 'all']);
  });

  it('queues a nested publish until the current event is fully delivered', () => {
    const bus = new InMemoryEventBus<Pinged | Ponged>();
    const log: string[] = [];
    bus.subscribe('Pinged', () =>
      bus.publish(domainEvent('Ponged', { n: 2 }, at)),
    );
    bus.subscribeAll((event) => log.push(event.type));

    bus.publish(domainEvent('Pinged', { n: 1 }, at));

    expect(log).toEqual(['Pinged', 'Ponged']);
  });

  it('still delivers to a handler unsubscribed during the publish', () => {
    const bus = new InMemoryEventBus<Pinged>();
    const calls: string[] = [];
    let unsubscribeLate = (): void => undefined;
    bus.subscribe('Pinged', () => unsubscribeLate());
    unsubscribeLate = bus.subscribe('Pinged', () => calls.push('late'));

    bus.publish(domainEvent('Pinged', { n: 1 }, at));
    bus.publish(domainEvent('Pinged', { n: 2 }, at));

    expect(calls).toEqual(['late']);
  });

  it('propagates a handler error and keeps working afterwards', () => {
    const bus = new InMemoryEventBus<Pinged | Ponged>();
    const seen: string[] = [];
    bus.subscribe('Pinged', () => {
      bus.publish(domainEvent('Ponged', { n: 2 }, at));
      throw new Error('boom');
    });
    bus.subscribeAll((event) => seen.push(event.type));

    expect(() => bus.publish(domainEvent('Pinged', { n: 1 }, at))).toThrow(
      'boom',
    );
    seen.length = 0;
    bus.publish(domainEvent('Ponged', { n: 3 }, at));

    expect(seen).toEqual(['Ponged']);
  });
});
