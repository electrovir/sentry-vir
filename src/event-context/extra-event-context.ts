import {typedHasProperty} from '@augment-vir/common';
import {Event, EventHint} from '@sentry/types';
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
 * Checks if extra event context has been injected into the input via extraEventContextSymbol and,
 * if so, extracts it.
 */
export function extractExtraContentFromSymbol(input: unknown): EventExtraContext | undefined {
    if (hasExtraEventContext(input)) {
        return input[extraEventContextSymbol];
    } else {
        return undefined;
    }
}

/**
 * Tries to extract extra event context via extraEventContextSymbol. Returns undefined if there is
 * no extra event context.
 */
export function extractExtraEventContext(event: EventHint | Event): EventExtraContext | undefined {
    const fromRootSymbol = extractExtraContentFromSymbol(event);
    const fromSubSymbol =
        'originalException' in event
            ? extractExtraContentFromSymbol(event.originalException)
            : undefined;
    const fromCapture = 'captureContext' in event ? event.captureContext : undefined;

    const combined: EventExtraContext = {
        ...fromRootSymbol,
        ...fromSubSymbol,
        ...fromCapture,
    };

    if (Object.keys(combined).length) {
        return combined;
    } else {
        return undefined;
    }
}
