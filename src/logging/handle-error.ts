import {
    EventExtraContext,
    convertEventDetailsToSentryContext,
} from '../event-context/event-context';
import {EventSeverityEnum} from '../event-context/event-severity';
import {addPrematureEvent} from './premature-events';
import {sentryClientForLogging} from './sentry-client-for-logging';

/** Record an error to Sentry without throwing it. */
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
