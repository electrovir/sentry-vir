import {isRuntimeTypeOf} from '@augment-vir/common';
import {Event as SentryEvent} from '@sentry/types';
import {
    EventDetails,
    EventExtraContext,
    convertEventDetailsToSentryContext,
} from '../event-context/event-context';
import {EventSeverityEnum, InfoEventSeverity} from '../event-context/event-severity';
import {addPrematureEvent} from './premature-events';
import {sentryClientForLogging} from './sentry-client-for-logging';

/** Send non-error events to Sentry. */
export const sendLog = {
    /** Sends an even to Sentry with debug severity. */
    [EventSeverityEnum.Debug]: wrapLogWithSeverity(EventSeverityEnum.Debug),
    /** Sends an even to Sentry with info severity. */
    [EventSeverityEnum.Info]: wrapLogWithSeverity(EventSeverityEnum.Info),
    /** Sends an even to Sentry with warning severity. */
    [EventSeverityEnum.Warning]: wrapLogWithSeverity(EventSeverityEnum.Warning),
} as const satisfies Record<
    InfoEventSeverity,
    (
        ...args: Parameters<ReturnType<typeof wrapLogWithSeverity>>
    ) => ReturnType<typeof sendLogToSentry>
>;

function wrapLogWithSeverity(severity: EventSeverityEnum) {
    return (info: Parameters<typeof sendLogToSentry>[0], extraContext?: EventExtraContext) => {
        return sendLogToSentry(info, {
            extraContext,
            severity,
        });
    };
}

function sendLogToSentry(
    logInfo: string | Omit<SentryEvent, 'extra' | 'level'>,
    eventDetails: EventDetails,
): string | undefined {
    try {
        if (!sentryClientForLogging) {
            addPrematureEvent({
                callback: sendLogToSentry,
                inputs: [
                    logInfo,
                    eventDetails,
                ],
            });
            return undefined;
        }

        const scopeContext = convertEventDetailsToSentryContext(eventDetails);

        const eventId: string = isRuntimeTypeOf(logInfo, 'string')
            ? sentryClientForLogging.captureMessage(logInfo, scopeContext)
            : sentryClientForLogging.captureEvent({
                  ...logInfo,
                  ...scopeContext,
              });

        return eventId;
    } catch (caught) {
        console.error('Error while trying to send Sentry log:', caught);
        return undefined;
    }
}
