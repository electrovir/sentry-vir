import {check} from '@augment-vir/assert';
import {type Attachment, type Event, type EventHint} from '@sentry/core';
import {type EventExtraContext, type EventTags} from './event-context.js';

/**
 * Symbol used to attach extra event context to events. This is particularly useful for errors so
 * they can be thrown while attaching this extra context to them.
 */
export const extraEventContextSymbol = Symbol('extra-event-context');

/**
 * Symbol used to attach extra event tags to events. Used alongside extraEventContextSymbol for
 * attaching tag data to thrown errors.
 */
export const extraEventTagsSymbol = Symbol('extra-event-tags');

/**
 * Symbol used to attach extra event attachments to events. Used alongside extraEventContextSymbol
 * for attaching file data to thrown errors.
 */
export const extraEventAttachmentsSymbol = Symbol('extra-event-attachments');

/** Simply describes an object that has extra event context. */
export type HasExtraContext = {[extraEventContextSymbol]: EventExtraContext};

/** Simply describes an object that has extra event tags. */
export type HasExtraTags = {[extraEventTagsSymbol]: EventTags};

/** Simply describes an object that has extra event attachments. */
export type HasExtraAttachments = {[extraEventAttachmentsSymbol]: ReadonlyArray<Attachment>};

/** Type guard for whether any given input has extra event context. */
export function hasExtraEventContext(input: unknown): input is HasExtraContext {
    return check.hasKey(input, extraEventContextSymbol) && !!input[extraEventContextSymbol];
}

/** Type guard for whether any given input has extra event tags. */
export function hasExtraEventTags(input: unknown): input is HasExtraTags {
    return check.hasKey(input, extraEventTagsSymbol) && !!input[extraEventTagsSymbol];
}

/** Type guard for whether any given input has extra event attachments. */
export function hasExtraEventAttachments(input: unknown): input is HasExtraAttachments {
    return check.hasKey(input, extraEventAttachmentsSymbol) && !!input[extraEventAttachmentsSymbol];
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
 * Checks if extra event tags have been injected into the input via extraEventTagsSymbol and, if so,
 * extracts them.
 */
export function extractExtraTagsFromSymbol(input: unknown): EventTags | undefined {
    if (hasExtraEventTags(input)) {
        return input[extraEventTagsSymbol];
    }
    return undefined;
}

/**
 * Checks if extra event attachments have been injected into the input via
 * extraEventAttachmentsSymbol and, if so, extracts them.
 */
export function extractExtraAttachmentsFromSymbol(
    input: unknown,
): ReadonlyArray<Attachment> | undefined {
    if (hasExtraEventAttachments(input)) {
        return input[extraEventAttachmentsSymbol];
    }
    return undefined;
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
    const fromCapture =
        'captureContext' in event && 'extra' in event.captureContext
            ? event.captureContext.extra
            : undefined;

    const combined = {
        ...fromRootSymbol,
        ...fromSubSymbol,
        ...fromCapture,
    } as EventExtraContext;

    if (Object.keys(combined).length) {
        return combined;
    } else {
        return undefined;
    }
}

/**
 * Tries to extract extra event tags via extraEventTagsSymbol. Returns undefined if there are no
 * extra event tags.
 */
export function extractExtraEventTags(event: EventHint | Event): EventTags | undefined {
    const fromRootSymbol = extractExtraTagsFromSymbol(event);
    const fromSubSymbol =
        'originalException' in event
            ? extractExtraTagsFromSymbol(event.originalException)
            : undefined;

    const combined: EventTags = {
        ...fromRootSymbol,
        ...fromSubSymbol,
    };

    if (Object.keys(combined).length) {
        return combined;
    } else {
        return undefined;
    }
}

/**
 * Tries to extract extra event attachments via extraEventAttachmentsSymbol. Returns undefined if
 * there are no extra event attachments.
 */
export function extractExtraEventAttachments(
    event: EventHint | Event,
): ReadonlyArray<Attachment> | undefined {
    const fromRootSymbol = extractExtraAttachmentsFromSymbol(event);
    const fromSubSymbol =
        'originalException' in event
            ? extractExtraAttachmentsFromSymbol(event.originalException)
            : undefined;

    const combined: ReadonlyArray<Attachment> = [
        ...(fromRootSymbol || []),
        ...(fromSubSymbol || []),
    ];

    if (combined.length) {
        return combined;
    } else {
        return undefined;
    }
}
