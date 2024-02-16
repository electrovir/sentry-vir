import {extractErrorMessage} from '@augment-vir/common';
import {
    ContextOptions,
    EventExtraContext,
    convertEventDetailsToSentryContext,
} from '../event-context/event-context';
import {EventSeverityEnum} from '../event-context/event-severity';
import {LoggingState, logToConsoleWithoutSentry} from '../processing/log-to-console';
import {addPrematureEvent} from './premature-events';
import {sentryClientForLogging} from './sentry-client-for-logging';

/** Record an error to Sentry without throwing it. */
export function handleError(error: unknown, extraContext?: EventExtraContext): string | undefined {
    return internalHandleError(error, extraContext, {
        wasSentPrematurely: false,
    });
}

function internalHandleError(
    error: unknown,
    extraContext: EventExtraContext | undefined,
    options: ContextOptions,
) {
    try {
        if (!sentryClientForLogging) {
            logToConsoleWithoutSentry(EventSeverityEnum.Error, LoggingState.NoSentryYet, {
                message: extractErrorMessage(error),
                event: undefined,
                extra: extraContext,
                hint: undefined,
                originalException: error,
            });
            addPrematureEvent(internalHandleError, [
                error,
                extraContext,
                {wasSentPrematurely: true},
            ]);
            return undefined;
        }

        const scopeContext = convertEventDetailsToSentryContext(
            {
                extraContext,
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
