import {check} from '@augment-vir/assert';
import {extractErrorMessage, type PartialWithUndefined} from '@augment-vir/common';
import {
    type ErrorEvent,
    type EventHint,
    type Event as SentryEvent,
    type TransactionEvent,
} from '@sentry/core';
import {
    convertEventDetailsToSentryContext,
    type ContextOptions,
    type EventContextAndTags,
    type EventDetails,
} from '../event-context/event-context.js';
import {EventSeverityEnum, type InfoEventSeverity} from '../event-context/event-severity.js';
import {extractOriginalMessage} from '../processing/event-processor.js';
import {LoggingState, logToConsoleWithoutSentry} from '../processing/log-to-console.js';
import {
    combineThrottleThreshold,
    defaultThrottleOptions,
    getActiveThrottleOptions,
    shouldThrottleEvent,
    skipBeforeSendThrottleContextKey,
    type ThrottleOptions,
} from '../processing/throttling.js';
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

/**
 * Runs the throttle decision and, if a state transition just occurred (`'started'` or `'ended'`)
 * and `disableThrottleLog` is not set, emits the corresponding `Throttling started: ...` /
 * `Throttling ended after suppressing N events: ...` warning via `sendLog.warning`. Returns whether
 * the event should be throttled (i.e. dropped).
 *
 * @category Internal
 */
export function throttleEventWithLogging(
    event: Pick<TransactionEvent | ErrorEvent, 'message'>,
    hint: Readonly<Pick<EventHint, 'originalException'>> | undefined,
    options: Readonly<PartialWithUndefined<ThrottleOptions>>,
): boolean {
    const result = shouldThrottleEvent(event, hint, options);
    const disableLog = options.disableThrottleLog ?? defaultThrottleOptions.disableThrottleLog;
    if (!disableLog && result.errorKey != undefined) {
        if (result.transition.kind === 'started') {
            sendLog.warning(`Throttling started: ${result.errorKey}`, {
                context: {
                    suppressedErrorKey: result.errorKey,
                },
                tags: {
                    suppressedErrorKey: result.errorKey,
                },
            });
        } else if (result.transition.kind === 'ended') {
            sendLog.warning(
                `Throttling ended after suppressing ${result.transition.suppressedCount} events: ${result.errorKey}`,
                {
                    context: {
                        suppressedErrorKey: result.errorKey,
                        suppressedCount: result.transition.suppressedCount,
                    },
                    tags: {
                        suppressedErrorKey: result.errorKey,
                    },
                },
            );
        }
    }
    return result.shouldThrottle;
}

/**
 * Synchronous pre-capture throttle check used by `sendLog` and `handleError`. Returns `true` when
 * the event should be dropped. Returns `false` (i.e. "send it") when no active throttle options
 * have been registered yet, so events sent before Sentry init aren't accidentally throttled.
 *
 * @category Internal
 */
export function checkActiveThrottle(
    event: Pick<TransactionEvent | ErrorEvent, 'message'>,
    hint: Readonly<Pick<EventHint, 'originalException'>> | undefined,
    perCallThreshold: number | undefined,
): boolean {
    const active = getActiveThrottleOptions();
    if (!active) {
        return false;
    }
    return throttleEventWithLogging(
        event,
        hint,
        combineThrottleThreshold(active, perCallThreshold),
    );
}

function wrapLogWithSeverity(severity: EventSeverityEnum) {
    return (info: Parameters<typeof sendLogToSentry>[0], eventOptions?: EventContextAndTags) => {
        return sendLogToSentry(
            info,
            {
                extraContext: eventOptions?.context,
                tags: eventOptions?.tags,
                attachments: eventOptions?.attachments,
                severity,
            },
            {
                wasSentPrematurely: false,
            },
            eventOptions?.throttleThreshold,
        );
    };
}

function sendLogToSentry(
    logInfo: SendLogInfo,
    eventDetails: EventDetails,
    options: ContextOptions,
    perCallThrottleThreshold: number | undefined,
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
                {
                    wasSentPrematurely: true,
                },
                perCallThrottleThreshold,
            ]);
            return undefined;
        }

        const throttleMessage = check.isString(resolvedLogInfo)
            ? resolvedLogInfo
            : extractOriginalMessage(resolvedLogInfo, undefined);
        if (
            checkActiveThrottle(
                {
                    message: throttleMessage,
                },
                undefined,
                perCallThrottleThreshold,
            )
        ) {
            return undefined;
        }

        const scopeContext = convertEventDetailsToSentryContext(eventDetails, options);
        const client = sentryClientForLogging;

        function captureWithClient(): string {
            return check.isString(resolvedLogInfo)
                ? client.captureMessage(resolvedLogInfo, scopeContext)
                : client.captureEvent({
                      ...resolvedLogInfo,
                      ...scopeContext,
                  });
        }

        const eventId: string = client.withScope((scope) => {
            scope.setContext(skipBeforeSendThrottleContextKey, {
                skipThrottle: true,
            });
            eventDetails.attachments?.forEach((attachment) => {
                scope.addAttachment(attachment);
            });
            return captureWithClient();
        });

        return eventId;
    } catch (caught) {
        console.error('Error while trying to send Sentry log:', caught);
        return undefined;
    }
}
