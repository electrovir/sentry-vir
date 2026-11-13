import {assert} from '@augment-vir/assert';
import {awaitedBlockingMap, createArray, type PartialWithUndefined} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import * as sentryBrowserDep from '@sentry/browser';
import {type Envelope, type Options} from '@sentry/core';
import {SentryExecutionEnvEnum} from '../env/execution-env.js';
import {consoleLogMethodPerSeverity, EventSeverityEnum} from '../event-context/event-severity.js';
import {isLoggingDisabled} from '../logging/logging-disabled.js';
import {throttleCache, type ThrottleOptions} from '../processing/throttling.js';
import {baseInitSentry, createSentryVirClient} from './base-sentry-init.js';

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

    describe('transactions', () => {
        async function initTestSentry({
            isDev,
            disableLogging,
            isLoud,
            throttleOptions,
            beforeSendTransaction,
        }: Readonly<
            PartialWithUndefined<{
                isDev: boolean;
                disableLogging: boolean;
                isLoud: boolean;
                throttleOptions: Partial<ThrottleOptions>;
                beforeSendTransaction: Options['beforeSendTransaction'];
            }>
        >) {
            const sentItemTypes: string[] = [];
            throttleCache.clear();

            const client = await baseInitSentry({
                dsn: 'https://public@example.com/1',
                releaseEnv: 'test',
                releaseName: 'test',
                isDev: !!isDev,
                silent: !isLoud,
                disableLogging,
                throttleOptions,
                executionEnv: SentryExecutionEnvEnum.Browser,
                sentryDep: sentryBrowserDep,
                sentryConfigOverrides: {
                    ...(beforeSendTransaction
                        ? {
                              beforeSendTransaction,
                          }
                        : {}),
                    tracesSampleRate: 1,
                    transport() {
                        return {
                            send(envelope: Envelope) {
                                envelope[1].forEach((item) => {
                                    sentItemTypes.push(item[0].type);
                                });
                                return Promise.resolve({});
                            },
                            flush() {
                                return Promise.resolve(true);
                            },
                        };
                    },
                },
            });

            return {
                client,
                sentItemTypes,
            };
        }

        async function sendTransactions({
            transactionCount,
            ...initOptions
        }: Readonly<
            Parameters<typeof initTestSentry>[0] &
                PartialWithUndefined<{
                    transactionCount: number;
                }>
        >) {
            const {client, sentItemTypes} = await initTestSentry(initOptions);

            try {
                createArray(transactionCount ?? 1, () => {
                    client.startSpan(
                        {
                            name: 'test transaction',
                        },
                        () => {},
                    );
                });
                await client.flush();
            } finally {
                client.setLoggingDisabled(false);
            }

            return sentItemTypes.filter((itemType) => itemType === 'transaction');
        }

        it('sends transactions outside of dev', async () => {
            assert.isLengthExactly(await sendTransactions({}), 1);
        });

        it('throttles transactions', async () => {
            assert.isLengthExactly(
                await sendTransactions({
                    throttleOptions: {
                        throttleThreshold: 1,
                        disableThrottleLog: true,
                    },
                    transactionCount: 3,
                }),
                1,
            );
        });

        async function captureConsoleLogs(
            severity: EventSeverityEnum,
            callback: () => Promise<void>,
        ) {
            const loggedArgs: unknown[][] = [];
            /** The console methods are captured at import, so patching `console` won't see calls. */
            const mutableConsoleMethods = consoleLogMethodPerSeverity satisfies Readonly<
                Record<EventSeverityEnum, (typeof console)['log']>
            > as Record<EventSeverityEnum, (typeof console)['log']>;
            const originalMethod = mutableConsoleMethods[severity];
            mutableConsoleMethods[severity] = (...args: unknown[]) => {
                loggedArgs.push(args);
            };

            try {
                await callback();
            } finally {
                mutableConsoleMethods[severity] = originalMethod;
            }

            return loggedArgs;
        }

        it('logs transactions to the console unless silent', async () => {
            const loudLogs = await captureConsoleLogs(EventSeverityEnum.Info, async () => {
                await sendTransactions({
                    isLoud: true,
                });
            });
            const silentLogs = await captureConsoleLogs(EventSeverityEnum.Info, async () => {
                await sendTransactions({});
            });

            assert.deepEquals(
                {
                    loudFirstArgs: loudLogs.map((args) => args[0]),
                    silentLogCount: silentLogs.length,
                },
                {
                    loudFirstArgs: [
                        'Sending to Sentry:',
                    ],
                    silentLogCount: 0,
                },
            );
        });

        it("ignores an earlier init's settings after init is called again", async () => {
            await initTestSentry({
                isDev: true,
            });

            assert.isLengthExactly(await sendTransactions({}), 1);
        });

        it('runs a user beforeSendTransaction after its own handling instead of replacing it', async () => {
            const userHookCallCounts = await awaitedBlockingMap(
                [
                    false,
                    true,
                ],
                async (isDev) => {
                    const userHookCalls: unknown[] = [];
                    const sentTransactions = await sendTransactions({
                        isDev,
                        beforeSendTransaction(event) {
                            userHookCalls.push(event);
                            return event;
                        },
                    });
                    return {
                        isDev,
                        sentCount: sentTransactions.length,
                        userHookCallCount: userHookCalls.length,
                    };
                },
            );

            assert.deepEquals(userHookCallCounts, [
                {
                    isDev: false,
                    sentCount: 1,
                    userHookCallCount: 1,
                },
                /** Dev mode drops the transaction before the user's hook ever sees it. */
                {
                    isDev: true,
                    sentCount: 0,
                    userHookCallCount: 0,
                },
            ]);
        });

        it('leaves error events to the error handler', async () => {
            const sentItemTypes: string[] = [];
            const errorLogs = await captureConsoleLogs(EventSeverityEnum.Error, async () => {
                const testSentry = await initTestSentry({
                    isLoud: true,
                });
                testSentry.client.captureException(new Error('test error'));
                await testSentry.client.flush();
                sentItemTypes.push(...testSentry.sentItemTypes);
            });

            assert.deepEquals(
                {
                    errorLogFirstArgs: errorLogs.map((args) => args[0]),
                    sentItemTypes,
                },
                {
                    errorLogFirstArgs: [
                        'Sending to Sentry:',
                    ],
                    sentItemTypes: [
                        'event',
                    ],
                },
            );
        });

        it('drops transactions in dev', async () => {
            assert.isEmpty(
                await sendTransactions({
                    isDev: true,
                }),
            );
        });

        it('drops transactions while logging is disabled', async () => {
            assert.isEmpty(
                await sendTransactions({
                    disableLogging: true,
                }),
            );
        });
    });
});
