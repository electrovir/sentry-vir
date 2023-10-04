import {
    EventExtraContext,
    convertEventDetailsToSentryContext,
} from '../event-context/event-context';
import {EventSeverityEnum} from '../event-context/event-severity';
import {addPrematureEvent} from './premature-events';
import {sentryClientForLogging} from './sentry-client-for-logging';

/**
 * Record an error to Sentry without throwing it. This can be called before
 * setSentryClientForLogging has been called, as sentry-vir will buffer all events. However,
 * setSentryClientForLogging must be called once at some point to actually clear that buffer.
 *
 * Similar to attachSentryTags and sendLog.
 */
export function handleError(error: unknown, extraContext?: EventExtraContext): string | undefined {
    try {
        if (!sentryClientForLogging) {
            addPrematureEvent({
                callback: handleError,
                inputs: [
                    error,
                    extraContext,
                ],
            });
            return undefined;
        }

        const scopeContext = convertEventDetailsToSentryContext({
            extraContext,
            severity: EventSeverityEnum.Error,
        });

        const eventId = sentryClientForLogging.captureException(error, scopeContext);
        return eventId;
    } catch (caught) {
        console.error('Error while trying to handle error with Sentry:', caught);
        return undefined;
    }
}
