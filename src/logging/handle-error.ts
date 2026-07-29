import {extractErrorMessage} from '@augment-vir/common';
import {type Attachment} from '@sentry/core';
import {
    type ContextOptions,
    type EventContextAndTags,
    convertEventDetailsToSentryContext,
} from '../event-context/event-context.js';
import {EventSeverityEnum} from '../event-context/event-severity.js';
import {
    extractExtraAttachmentsFromSymbol,
    extractExtraEventThrottle,
    extractExtraTagsFromSymbol,
} from '../event-context/extra-event-context.js';
import {LoggingState, logToConsoleWithoutSentry} from '../processing/log-to-console.js';
import {skipBeforeSendThrottleContextKey} from '../processing/throttling.js';
import {isLoggingDisabled} from './logging-disabled.js';
import {addPrematureEvent} from './premature-events.js';
import {checkActiveThrottle} from './send-log.js';
import {sentryClientForLogging} from './sentry-client-for-logging.js';

/** Record an error to Sentry without throwing it. */
export function handleError(
    error: unknown,
    eventOptions?: EventContextAndTags,
): string | undefined {
    return internalHandleError(error, eventOptions, {
        wasSentPrematurely: false,
    });
}

function internalHandleError(
    error: unknown,
    eventOptions: EventContextAndTags | undefined,
    options: ContextOptions,
) {
    if (isLoggingDisabled()) {
        return undefined;
    }

    try {
        if (!sentryClientForLogging) {
            logToConsoleWithoutSentry(EventSeverityEnum.Error, LoggingState.NoSentryYet, {
                message: extractErrorMessage(error),
                event: undefined,
                extra: eventOptions?.context,
                hint: undefined,
                originalException: error,
            });
            addPrematureEvent(internalHandleError, [
                error,
                eventOptions,
                {
                    wasSentPrematurely: true,
                },
            ]);
            return undefined;
        }

        const errorThrottleOverride = extractExtraEventThrottle({
            originalException: error,
        });
        const disableThrottling =
            eventOptions?.throttle?.disabled === true || errorThrottleOverride?.disabled === true;
        if (!disableThrottling) {
            const perCallThresholdCandidates = [
                errorThrottleOverride?.threshold,
                eventOptions?.throttle?.threshold,
            ].filter((value): value is number => value != undefined);
            const perCallThrottleThreshold = perCallThresholdCandidates.length
                ? Math.min(...perCallThresholdCandidates)
                : undefined;
            const symbolTags = extractExtraTagsFromSymbol(error);
            const combinedTags =
                symbolTags == undefined && eventOptions?.tags == undefined
                    ? undefined
                    : {
                          ...symbolTags,
                          ...eventOptions?.tags,
                      };
            if (
                checkActiveThrottle(
                    {
                        message: extractErrorMessage(error),
                        ...(combinedTags
                            ? {
                                  tags: combinedTags,
                              }
                            : {}),
                    },
                    {
                        originalException: error,
                    },
                    perCallThrottleThreshold,
                )
            ) {
                return undefined;
            }
        }

        const scopeContext = convertEventDetailsToSentryContext(
            {
                extraContext: eventOptions?.context,
                tags: eventOptions?.tags,
                severity: EventSeverityEnum.Error,
            },
            options,
        );

        const client = sentryClientForLogging;
        const allAttachments: ReadonlyArray<Attachment> = [
            ...(eventOptions?.attachments || []),
            ...(extractExtraAttachmentsFromSymbol(error) || []),
        ];

        const eventId = client.withScope((scope) => {
            scope.setContext(skipBeforeSendThrottleContextKey, {
                skipThrottle: true,
            });
            allAttachments.forEach((attachment) => {
                scope.addAttachment(attachment);
            });
            return client.captureException(error, scopeContext);
        });
        return eventId;
    } catch (caught) {
        console.error('Error while trying to handle error with Sentry:', caught);
        return undefined;
    }
}
