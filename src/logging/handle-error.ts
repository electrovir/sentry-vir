import {extractErrorMessage} from '@augment-vir/common';
import {
    type ContextOptions,
    type EventContextAndTags,
    convertEventDetailsToSentryContext,
} from '../event-context/event-context.js';
import {EventSeverityEnum} from '../event-context/event-severity.js';
import {LoggingState, logToConsoleWithoutSentry} from '../processing/log-to-console.js';
import {addPrematureEvent} from './premature-events.js';
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
                {wasSentPrematurely: true},
            ]);
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

        const eventId = sentryClientForLogging.captureException(error, scopeContext);
        return eventId;
    } catch (caught) {
        console.error('Error while trying to handle error with Sentry:', caught);
        return undefined;
    }
}
