import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes with last-one-wins semantics.
 *
 * Plain string concatenation does not work with Tailwind: `"p-2" + "p-4"`
 * leaves both in the class list and the winner is decided by stylesheet
 * order, not by the caller. `twMerge` drops the earlier conflicting utility
 * so a consumer can always override a component's default:
 *
 *   cn('px-4 py-2 bg-primary', props.class)  // consumer's bg- wins
 *
 * Every component in this kit funnels its host classes through `cn` for
 * exactly that reason - it is what makes the components restyleable without
 * forking them.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
