/** Something that happened in a bounded context, named in the past tense. */
export interface DomainEvent<
  TType extends string = string,
  TPayload = unknown,
> {
  readonly type: TType;
  /** ISO 8601, UTC. */
  readonly occurredAt: string;
  readonly payload: TPayload;
}

export function domainEvent<TType extends string, TPayload>(
  type: TType,
  payload: TPayload,
  at: Date,
): DomainEvent<TType, TPayload> {
  return { type, occurredAt: at.toISOString(), payload };
}
