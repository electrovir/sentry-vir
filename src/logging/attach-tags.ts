import {type EventTags} from '../event-context/event-context.js';
import {addPrematureEvent} from './premature-events.js';
import {sentryClientForLogging} from './sentry-client-for-logging.js';

/** Set tags for all future Sentry event handling (errors and logs). */
export function attachSentryTags(tags: EventTags) {
    try {
        if (!sentryClientForLogging) {
            addPrematureEvent(attachSentryTags, [tags]);
            return;
        }

        sentryClientForLogging.setTags(tags);
    } catch (caught) {
        console.error('Error while trying to attach Sentry tags:', caught);
        return undefined;
    }
}
