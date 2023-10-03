import {typedHasProperty} from '@augment-vir/common';
import {EventExtraContext} from './event-context';

/**
 * Symbol used to attach extra event context to events. This is particularly useful for errors so
 * they can be thrown while attaching this extra context to them.
 */
export const extraEventContextSymbol = Symbol('extra-event-context');

/** Simply describes an object that has extra event context. */
export type HasExtraContext = {[extraEventContextSymbol]: EventExtraContext};

/** Type guard for whether any given input has extra event context. */
export function hasExtraEventContext(input: unknown): input is HasExtraContext {
    return typedHasProperty(input, extraEventContextSymbol);
}

/**
 * Tries to extract extra event context via extraEventContextSymbol. Returns undefined if there is
 * no extra event context.
 */
export function extractExtraEventContext(event: unknown): EventExtraContext | undefined {
    if (hasExtraEventContext(event)) {
        return event[extraEventContextSymbol];
    } else {
        return undefined;
    }
}
