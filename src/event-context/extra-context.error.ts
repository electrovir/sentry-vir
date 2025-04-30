import {ensureError} from '@augment-vir/common';
import {type EventExtraContext} from './event-context.js';
import {extraEventContextSymbol, type HasExtraContext} from './extra-event-context.js';

/**
 * Constructs an error with extra event context attached to it in the same way that
 * throwWithExtraContext attaches data.
 *
 * The following examples are equivalent:
 *
 * @example Throw new ExtraContextError('my error', {stuff: 'hi'});
 *
 * @example Const myError = new Error('my error'); throwWithExtraContext(myError, {stuff: 'hi'});
 */
export class ExtraContextError extends Error implements HasExtraContext {
    public readonly [extraEventContextSymbol]: EventExtraContext;

    constructor(message: string, extraData: EventExtraContext) {
        super(message);
        this[extraEventContextSymbol] = extraData;
    }
}

/**
 * Adds extra context to an error without modifying the error's message or stack trace (or any of
 * its other properties), then throws the error so it can propagate as usual.
 */
export function throwWithExtraContext(originalError: unknown, extraData: EventExtraContext): never {
    const error = ensureError(originalError) as Error & HasExtraContext;
    error[extraEventContextSymbol] = extraData;

    throw error;
}
