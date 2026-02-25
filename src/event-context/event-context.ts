import {type JsonCompatibleObject, type PartialWithUndefined} from '@augment-vir/common';
import {type ScopeContext, type setTags} from '@sentry/core';
import {type EventSeverityEnum} from './event-severity.js';

/**
 * Used for all extra context types. While keys must be strings, values can be whatever but must be
 * JSON compatible.
 */
export type EventExtraContext = JsonCompatibleObject;

/** Allowed tag value types for Sentry event tags. */
export type EventTags = Parameters<typeof setTags>[0];

/**
 * Combined context and tags parameter used for event logging functions. Both properties are
 * optional.
 */
export type EventContextAndTags = PartialWithUndefined<{
    context: EventExtraContext;
    tags: EventTags;
}>;

/** Function that generates extra event context. */
export type EventExtraContextCreator = () => EventExtraContext;

/** Event details before getting sent to Sentry. */
export type EventDetails = {
    extraContext?: EventExtraContext | undefined;
    tags?: EventTags | undefined;
    severity: EventSeverityEnum;
};

/** Options for creating contexts. Used internally. */
export type ContextOptions = {
    /**
     * If true, this means the message was sent before Sentry was initialized, which slightly
     * changes how the event is logged in the browser.
     */
    wasSentPrematurely: boolean;
};

/**
 * Maps internal EventDetails type to Sentry's required type for event severity, extra context, and
 * tags.
 */
export function convertEventDetailsToSentryContext(
    eventDetails: EventDetails,
    options: ContextOptions,
): Pick<ScopeContext, 'extra' | 'level'> & Partial<Pick<ScopeContext, 'tags'>> {
    const extra = {
        ...(options.wasSentPrematurely
            ? {
                  wasSentPrematurely: true,
              }
            : {}),
        ...eventDetails.extraContext,
    };

    return {
        extra,
        level: eventDetails.severity,
        ...(eventDetails.tags ? {tags: eventDetails.tags} : {}),
    };
}
