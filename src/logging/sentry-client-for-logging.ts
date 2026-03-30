import {type MaybePromise} from '@augment-vir/common';
import {type SentryDep} from '../env/execution-env.js';
import {sendPrematureEvents} from './premature-events.js';

/** The bare minimum Sentry client needed for logging events. */
export type SentryClientForLogging = Pick<
    SentryDep,
    'captureMessage' | 'captureException' | 'captureEvent' | 'setTags' | 'withScope'
>;
/** Internal sentry client used for logging. */
export let sentryClientForLogging: SentryClientForLogging | undefined;

/**
 * Asynchronously set the Sentry client for logging. When this is called, any events that were
 * triggered beforehand are handled. Thus, this set can be done at any time, allowing for
 * asynchronous Sentry client setup but synchronous log and error handling.
 *
 * This should be called as soon as possible after you have a return value from initSentry.
 *
 * This can be safely called multiple times (to overwrite the previously set Sentry client) because
 * previous events won't be handled multiple times.
 */
export async function setSentryClientForLogging(client: MaybePromise<SentryClientForLogging>) {
    const hadClientBefore = !!sentryClientForLogging;

    sentryClientForLogging = await client;

    if (!hadClientBefore) {
        sendPrematureEvents();
    }
}
