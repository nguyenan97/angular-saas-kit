/** The suite's own API: the latest domain events, for the Overview's feed. */
export const ACTIVITY_URL = '/api/suite/activity';

/** One line of the feed, newest first. */
export interface ActivityEntry {
  readonly type: 'OrderPlaced' | 'OrderCancelled';
  /** ISO 8601. */
  readonly occurredAt: string;
  readonly orderId: string;
  /** Said as it is: "SO-0061 was placed for Minh Chau Mart, ₫540,000". */
  readonly text: string;
}
