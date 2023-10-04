import type {setTags} from '@sentry/core';
import {addPrematureEvent} from './premature-events';
import {sentryClientForLogging} from './sentry-client-for-logging';

/** A list of tag names as keys and their values. Set a tag to undefined to clear it. */
export type SentryTags = Parameters<typeof setTags>[0];

/**
 * Set tags for all future Sentry event handling (errors and logs). This can be called before
 * setSentryClientForLogging has been called, as sentry-vir will buffer all events. However,
 * setSentryClientForLogging must be called once at some point to actually clear that buffer.
 *
 * Similar to handleError and sendLog.
 */
export function attachSentryTags(tags: SentryTags) {
    try {
        if (!sentryClientForLogging) {
            addPrematureEvent({callback: attachSentryTags, inputs: [tags]});
            return;
        }

        sentryClientForLogging.setTags(tags);
    } catch (caught) {
        console.error('Error while trying to attach Sentry tags:', caught);
        return undefined;
    }
}
