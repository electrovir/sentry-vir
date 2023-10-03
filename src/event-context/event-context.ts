import {JsonCompatibleValue} from '@augment-vir/common';
import {ScopeContext} from '@sentry/types';
import {EventSeverityEnum} from './event-severity';

/**
 * Used for all extra context types. While keys must be strings, values can be whatever but must be
 * JSON compatible.
 */
export type EventExtraContext = Record<string, JsonCompatibleValue>;

/** Function that generates extra event context. */
export type EventExtraContextCreator = () => EventExtraContext;

/** Event details before getting sent to Sentry. */
export type EventDetails = {
    extraContext?: EventExtraContext | undefined;
    severity: EventSeverityEnum;
};

/** Maps internal EventDetails type to Sentry's required type for event severity and extra context. */
export function convertEventDetailsToSentryContext(
    eventDetails: EventDetails,
): Pick<ScopeContext, 'extra' | 'level'> {
    return {
        extra: eventDetails.extraContext ?? {},
        level: eventDetails.severity,
    };
}
