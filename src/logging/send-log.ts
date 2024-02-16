import {Event as SentryEvent} from '@sentry/types';
import {isRunTimeType} from 'run-time-assertions';
import {
    ContextOptions,
    EventDetails,
    EventExtraContext,
    convertEventDetailsToSentryContext,
} from '../event-context/event-context';
import {EventSeverityEnum, InfoEventSeverity} from '../event-context/event-severity';
import {extractOriginalMessage} from '../processing/event-processor';
import {LoggingState, logToConsoleWithoutSentry} from '../processing/log-to-console';
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
        return sendLogToSentry(
            info,
            {
                extraContext,
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
                message: isRunTimeType(logInfo, 'string')
                    ? logInfo
                    : extractOriginalMessage(logInfo, undefined),
                event: isRunTimeType(logInfo, 'string') ? undefined : logInfo,
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

        const eventId: string = isRunTimeType(logInfo, 'string')
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
