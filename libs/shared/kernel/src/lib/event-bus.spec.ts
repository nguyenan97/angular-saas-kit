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
});
