import type {setTags} from '@sentry/core';
import {addPrematureEvent} from './premature-events';
import {sentryClientForLogging} from './sentry-client-for-logging';

/** A list of tag names as keys and their values. Set a tag to undefined to clear it. */
export type SentryTags = Parameters<typeof setTags>[0];

/** Set tags for all future Sentry event handling (errors and logs). */
export function attachSentryTags(tags: SentryTags) {
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
