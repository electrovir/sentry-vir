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
    extractExtraEventThrottleThreshold,
    extractExtraTagsFromSymbol,
} from '../event-context/extra-event-context.js';
import {LoggingState, logToConsoleWithoutSentry} from '../processing/log-to-console.js';
import {skipBeforeSendThrottleContextKey} from '../processing/throttling.js';
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

        const perCallThresholdCandidates = [
            extractExtraEventThrottleThreshold({
                originalException: error,
            }),
            eventOptions?.throttleThreshold,
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
