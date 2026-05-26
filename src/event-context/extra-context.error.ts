import {ensureError} from '@augment-vir/common';
import {type Attachment} from '@sentry/core';
import {type EventContextAndTags, type EventExtraContext, type EventTags} from './event-context.js';
import {
    extraEventAttachmentsSymbol,
    extraEventContextSymbol,
    extraEventTagsSymbol,
    extraEventThrottleThresholdSymbol,
    type HasExtraAttachments,
    type HasExtraContext,
} from './extra-event-context.js';

/**
 * Constructs an error with extra event context attached to it in the same way that
 * throwWithExtraContext attaches data.
 *
 * The following examples are equivalent:
 *
 * @example Throw new ExtraContextError('my error', {context: {stuff: 'hi'}});
 *
 * @example Const myError = new Error('my error'); throwWithExtraContext(myError, {context: {stuff:
 * 'hi'}});
 */
export class ExtraContextError extends Error {
    public readonly [extraEventContextSymbol]: EventExtraContext | undefined;
    public readonly [extraEventTagsSymbol]: EventTags | undefined;
    public readonly [extraEventAttachmentsSymbol]: ReadonlyArray<Attachment> | undefined;
    public readonly [extraEventThrottleThresholdSymbol]: number | undefined;

    constructor(message: string, extraData: EventContextAndTags) {
        super(message);
        if (extraData.context) {
            this[extraEventContextSymbol] = extraData.context;
        }
        if (extraData.tags) {
            this[extraEventTagsSymbol] = extraData.tags;
        }
        if (extraData.attachments) {
            this[extraEventAttachmentsSymbol] = extraData.attachments;
        }
        if (extraData.throttleThreshold != undefined) {
            this[extraEventThrottleThresholdSymbol] = extraData.throttleThreshold;
        }
    }
}

/**
 * Adds extra context to an error without modifying the error's message or stack trace (or any of
 * its other properties), then throws the error so it can propagate as usual.
 */
export function throwWithExtraContext(
    originalError: unknown,
    extraData: EventContextAndTags,
): never {
    const error = ensureError(originalError) as Error &
        HasExtraAttachments &
        HasExtraContext & {
            [extraEventTagsSymbol]?: EventTags;
            [extraEventThrottleThresholdSymbol]?: number;
        };
    if (extraData.context) {
        error[extraEventContextSymbol] = extraData.context;
    }
    if (extraData.tags) {
        error[extraEventTagsSymbol] = extraData.tags;
    }
    if (extraData.attachments) {
        error[extraEventAttachmentsSymbol] = extraData.attachments;
    }
    if (extraData.throttleThreshold != undefined) {
        error[extraEventThrottleThresholdSymbol] = extraData.throttleThreshold;
    }

    throw error;
}
