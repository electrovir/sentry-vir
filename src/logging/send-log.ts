import {check} from '@augment-vir/assert';
import {extractErrorMessage} from '@augment-vir/common';
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

/** A Sentry event object without the fields that are set by the logging context. */
export type SendLogEvent = Omit<SentryEvent, 'extra' | 'level'>;

/** All accepted input types for `sendLog`. Strings, Error objects, and raw Sentry events. */
export type SendLogInfo = string | Error | SendLogEvent;

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
    logInfo: SendLogInfo,
    eventDetails: EventDetails,
    options: ContextOptions,
): string | undefined {
    try {
        /**
         * `Error.message` is not enumerable, so spreading an `Error` into `captureEvent` would lose
         * the message entirely and produce an `<unlabeled event>` in Sentry. Extract the message
         * string so it goes through the `captureMessage` path instead.
         */
        const resolvedLogInfo: string | SendLogEvent =
            logInfo instanceof Error ? extractErrorMessage(logInfo) : logInfo;

        if (!sentryClientForLogging) {
            logToConsoleWithoutSentry(eventDetails.severity, LoggingState.NoSentryYet, {
                message: check.isString(resolvedLogInfo)
                    ? resolvedLogInfo
                    : extractOriginalMessage(resolvedLogInfo, undefined),
                event: check.isString(resolvedLogInfo) ? undefined : resolvedLogInfo,
                extra: eventDetails.extraContext,
                hint: undefined,
                originalException: undefined,
            });
            addPrematureEvent(sendLogToSentry, [
                resolvedLogInfo,
                eventDetails,
                {wasSentPrematurely: true},
            ]);
            return undefined;
        }

        const scopeContext = convertEventDetailsToSentryContext(eventDetails, options);

        const eventId: string = check.isString(resolvedLogInfo)
            ? sentryClientForLogging.captureMessage(resolvedLogInfo, scopeContext)
            : sentryClientForLogging.captureEvent({
                  ...resolvedLogInfo,
                  ...scopeContext,
              });

        return eventId;
    } catch (caught) {
        console.error('Error while trying to send Sentry log:', caught);
        return undefined;
    }
}
