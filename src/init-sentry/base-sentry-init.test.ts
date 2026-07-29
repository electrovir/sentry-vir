import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import * as sentryBrowserDep from '@sentry/browser';
import {isLoggingDisabled} from '../logging/logging-disabled.js';
import {createSentryVirClient} from './base-sentry-init.js';

/**
 * Sentry exports that consumers call directly on the client returned from `initSentry`. The client
 * is a copy of the Sentry module namespace, so these have to survive the copy.
 */
const consumedSentryExports = [
    'addEventProcessor',
    'captureEvent',
    'captureException',
    'captureMessage',
    'flush',
    'getClient',
    'init',
    'setTag',
    'setTags',
    'setUser',
    'withScope',
] as const satisfies ReadonlyArray<keyof typeof sentryBrowserDep>;

describe(createSentryVirClient.name, () => {
    it('preserves every Sentry export that consumers call', () => {
        const client = createSentryVirClient(sentryBrowserDep);

        assert.deepEquals(
            consumedSentryExports.filter((key) => client[key] !== sentryBrowserDep[key]),
            [],
        );
    });

    it('still applies tags through the client', () => {
        const client = createSentryVirClient(sentryBrowserDep);

        /** `setTag` writes to the isolation scope, not the current scope. */
        const scopeTags = client.withIsolationScope((scope) => {
            client.setTag('service', 'test-service');
            return scope.getScopeData().tags;
        });

        assert.deepEquals(scopeTags, {
            service: 'test-service',
        });
    });

    it('leaves the Sentry module namespace untouched', () => {
        createSentryVirClient(sentryBrowserDep);

        /**
         * Defining the addition on the namespace itself would throw in Node, where the namespace is
         * a real non-extensible module namespace object rather than a bundled stand-in.
         */
        assert.isFalse('setLoggingDisabled' in sentryBrowserDep);
    });

    it('toggles the global logging flag from the client', () => {
        const client = createSentryVirClient(sentryBrowserDep);

        try {
            client.setLoggingDisabled(true);
            assert.isTrue(isLoggingDisabled());

            client.setLoggingDisabled(false);
            assert.isFalse(isLoggingDisabled());
        } finally {
            client.setLoggingDisabled(false);
        }
    });
});
