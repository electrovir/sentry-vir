import type {ScopeContext} from '@sentry/types';
import {EventSeverityEnum} from './event-severity';

/**
 * Used for all extra context types. While keys must be strings, values can be whatever but must be
 * JSON compatible.
 */
export type EventExtraContext = Record<string, unknown>;

/** Function that generates extra event context. */
export type EventExtraContextCreator = () => EventExtraContext;

/** Event details before getting sent to Sentry. */
export type EventDetails = {
    extraContext?: EventExtraContext | undefined;
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

/** Maps internal EventDetails type to Sentry's required type for event severity and extra context. */
export function convertEventDetailsToSentryContext(
    eventDetails: EventDetails,
    options: ContextOptions,
): Pick<ScopeContext, 'extra' | 'level'> {
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
    };
}
