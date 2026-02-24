import {check} from '@augment-vir/assert';
import {type Event as SentryEvent} from '@sentry/core';
import {
    type ContextOptions,
    type EventContextAndTags,
    type EventDetails,
    convertEventDetailsToSentryContext,
} from '../event-context/event-context.js';
import {EventSeverityEnum, type InfoEventSeverity} from '../event-context/event-severity.js';
import {extractOriginalMessage} from '../processing/event-processor.js';
import {LoggingState, logToConsoleWithoutSentry} from '../processing/log-to-console.js';
import {addPrematureEvent} from './premature-events.js';
import {sentryClientForLogging} from './sentry-client-for-logging.js';

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
    return (info: Parameters<typeof sendLogToSentry>[0], eventOptions?: EventContextAndTags) => {
        return sendLogToSentry(
            info,
            {
                extraContext: eventOptions?.context,
                tags: eventOptions?.tags,
                severity,
            },
            {
                wasSentPrematurely: false,
            },
        );
    };
}

function sendLogToSentry(
    logInfo: string | Omit<SentryEvent, 'extra' | 'level'>,
    eventDetails: EventDetails,
    options: ContextOptions,
): string | undefined {
    try {
        if (!sentryClientForLogging) {
            logToConsoleWithoutSentry(eventDetails.severity, LoggingState.NoSentryYet, {
                message: check.isString(logInfo)
                    ? logInfo
                    : extractOriginalMessage(logInfo, undefined),
                event: check.isString(logInfo) ? undefined : logInfo,
                extra: eventDetails.extraContext,
                hint: undefined,
                originalException: undefined,
            });
            addPrematureEvent(sendLogToSentry, [
                logInfo,
                eventDetails,
                {wasSentPrematurely: true},
            ]);
            return undefined;
        }

        const scopeContext = convertEventDetailsToSentryContext(eventDetails, options);

        const eventId: string = check.isString(logInfo)
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
