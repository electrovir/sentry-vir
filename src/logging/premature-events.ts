import {AnyFunction} from '@augment-vir/common';

/** An event that was triggered before setSentryClientForLogging was called. */
export type PrematureEvent<EntryPointFunction extends AnyFunction = AnyFunction> = {
    callback: EntryPointFunction;
    inputs: Parameters<EntryPointFunction>;
};

/**
 * Used to store events before the Sentry client is setup. This is exported for testing purposes
 * only, you don't need to do anything with this.
 */
const prematureSentryEvents: PrematureEvent[] = [];

export function sendPrematureEvents() {
    while (prematureSentryEvents.length) {
        try {
            const prematureEvent = prematureSentryEvents.pop();
            if (!prematureEvent) {
                return;
            }

            prematureEvent.callback(...prematureEvent.inputs);
        } catch (caught) {
            console.error('error while trying to send premature sentry events:', caught);
        }
    }
}

export function addPrematureEvent(prematureEvent: PrematureEvent) {
    prematureSentryEvents.push(prematureEvent);
}
