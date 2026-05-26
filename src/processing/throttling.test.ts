import {assert} from '@augment-vir/assert';
import {applyBrand} from '@augment-vir/common';
import {describe, it, itCases} from '@augment-vir/test';
import {calculateRelativeDate, getNowInUtcTimezone} from 'date-vir';
import {type FuzzyIndexKey} from 'fuzzy-vir';
import {
    combineThrottleThreshold,
    fuzzyErrorIndex,
    shouldThrottleEvent,
    throttleCache,
    type ThrottleCacheEntry,
} from './throttling.js';

describe(shouldThrottleEvent.name, () => {
    type TestThrottleCacheEntry = Omit<ThrottleCacheEntry, 'intervalStartAt'>;

    function isThrottled(...args: Parameters<typeof shouldThrottleEvent>): boolean {
        return shouldThrottleEvent(...args).shouldThrottle;
    }

    function testShouldThrottle(
        initThrottleCache: Map<FuzzyIndexKey, ThrottleCacheEntry>,
        ...params: Parameters<typeof shouldThrottleEvent>
    ) {
        fuzzyErrorIndex.destroy();
        throttleCache.clear();
        for (const [
            key,
            value,
        ] of initThrottleCache) {
            throttleCache.set(key, value);
        }
        const isThrottled = shouldThrottleEvent(...params).shouldThrottle;
        const throttleCacheResult: Record<string, TestThrottleCacheEntry> = {};
        for (const [
            key,
            value,
        ] of throttleCache) {
            throttleCacheResult[key] = {
                intervalCount: value.intervalCount,
            };
        }
        return {
            isThrottled,
            throttleCache: throttleCacheResult,
        };
    }
    const now = getNowInUtcTimezone();
    const errorName = applyBrand<FuzzyIndexKey>('errorName');

    itCases(testShouldThrottle, [
        {
            it: 'does not throttle on empty cache',
            inputs: [
                new Map(),
                {
                    message: 'errorName',
                },
                {},
            ],
            expect: {
                isThrottled: false,
                throttleCache: {
                    errorName: {
                        intervalCount: 1,
                    },
                },
            },
        },
        {
            it: 'throttles when threshold surpassed within current interval',
            inputs: [
                new Map([
                    [
                        errorName,
                        {
                            intervalCount: 600,
                            intervalStartAt: now,
                        },
                    ],
                ]),
                {
                    message: 'errorName',
                },
                {},
            ],
            expect: {
                isThrottled: true,
                throttleCache: {
                    errorName: {
                        intervalCount: 601,
                    },
                },
            },
        },
        {
            it: 'does nothing when disabled',
            inputs: [
                new Map([
                    [
                        errorName,
                        {
                            intervalCount: 600,
                            intervalStartAt: now,
                        },
                    ],
                ]),
                {
                    message: 'errorName',
                },
                {},
                {
                    disableThrottling: true,
                },
            ],
            expect: {
                isThrottled: false,
                throttleCache: {
                    errorName: {
                        intervalCount: 600,
                    },
                },
            },
        },
        {
            it: 'resets count when interval has elapsed',
            inputs: [
                new Map([
                    [
                        errorName,
                        {
                            intervalCount: 600,
                            intervalStartAt: calculateRelativeDate(now, {
                                hours: -2,
                            }),
                        },
                    ],
                ]),
                {
                    message: 'errorName',
                },
                {},
            ],
            expect: {
                isThrottled: false,
                throttleCache: {
                    errorName: {
                        intervalCount: 1,
                    },
                },
            },
        },
        {
            it: 'uses hint when message is not provided on event',
            inputs: [
                new Map(),
                {},
                {
                    originalException: {
                        message: 'errorName',
                    },
                },
            ],
            expect: {
                isThrottled: false,
                throttleCache: {
                    errorName: {
                        intervalCount: 1,
                    },
                },
            },
        },
    ]);

    it('counts near-duplicate messages toward the same throttle bucket', () => {
        fuzzyErrorIndex.destroy();
        throttleCache.clear();

        const options = {
            throttleThreshold: 3,
            disableThrottleLog: true,
        };
        const variants = [
            'Database query failed: id abc123 not found in users',
            'Database query failed: id def456 not found in users',
            'Database query failed: id 789xyz not found in users',
            'Database query failed: id qwerty not found in users',
        ];

        const results = variants.map((message) =>
            isThrottled(
                {
                    message,
                },
                undefined,
                options,
            ),
        );

        assert.deepEquals(results, [
            false,
            false,
            false,
            true,
        ]);
        assert.strictEquals(fuzzyErrorIndex.clusterOrder.size, 1);
        const [onlyEntry] = throttleCache.values();
        assert.strictEquals(onlyEntry?.intervalCount, variants.length);
    });

    it('keeps unrelated messages in separate throttle buckets', () => {
        fuzzyErrorIndex.destroy();
        throttleCache.clear();

        const options = {
            throttleThreshold: 3,
            disableThrottleLog: true,
        };
        const networkError = 'Network request to https://api.example.com/users timed out after 30s';
        const parserError = 'SyntaxError: Unexpected token < in JSON at position 0 in response';

        const messages = [
            networkError,
            networkError,
            networkError,
            parserError,
            parserError,
            parserError,
        ];
        const results = messages.map((message) =>
            isThrottled(
                {
                    message,
                },
                undefined,
                options,
            ),
        );

        assert.deepEquals(results, [
            false,
            false,
            false,
            false,
            false,
            false,
        ]);
        assert.strictEquals(fuzzyErrorIndex.clusterOrder.size, 2);
        const counts = [...throttleCache.values()].map((entry) => entry.intervalCount);
        assert.deepEquals(
            counts,
            [
                3,
                3,
            ],
        );
    });

    it('does not let an unrelated message tip an already-near-threshold bucket', () => {
        fuzzyErrorIndex.destroy();
        throttleCache.clear();

        const options = {
            throttleThreshold: 3,
            disableThrottleLog: true,
        };
        const dbErrors = [
            'Database query failed: id abc123 not found in users',
            'Database query failed: id def456 not found in users',
            'Database query failed: id 789xyz not found in users',
        ];
        const unrelated = 'SyntaxError: Unexpected token < in JSON at position 0 in response';

        dbErrors.forEach((message) =>
            assert.strictEquals(
                isThrottled(
                    {
                        message,
                    },
                    undefined,
                    options,
                ),
                false,
            ),
        );
        // An unrelated message goes to its own bucket; the db bucket stays at 3.
        assert.strictEquals(
            isThrottled(
                {
                    message: unrelated,
                },
                undefined,
                options,
            ),
            false,
        );
        assert.strictEquals(fuzzyErrorIndex.clusterOrder.size, 2);
    });

    it('combineThrottleThreshold takes the minimum of base and per-call thresholds', () => {
        assert.strictEquals(
            combineThrottleThreshold(
                {
                    throttleThreshold: 500,
                },
                1,
            ).throttleThreshold,
            1,
        );
        assert.strictEquals(
            combineThrottleThreshold(
                {
                    throttleThreshold: 2,
                },
                999,
            ).throttleThreshold,
            2,
        );
    });

    it('combineThrottleThreshold returns the base unchanged when no per-call threshold given', () => {
        const base = {
            throttleThreshold: 500,
            disableThrottleLog: true,
        };
        assert.strictEquals(combineThrottleThreshold(base, undefined), base);
    });

    it('honors a per-call throttle threshold that is stricter than the global threshold', () => {
        fuzzyErrorIndex.destroy();
        throttleCache.clear();

        const options = combineThrottleThreshold(
            {
                throttleThreshold: 500,
                disableThrottleLog: true,
            },
            1,
        );
        const event = {
            message: 'per-call throttled message alpha beta gamma',
        };

        assert.strictEquals(isThrottled(event, undefined, options), false);
        assert.strictEquals(isThrottled(event, undefined, options), true);
    });

    it('ignores a per-call throttle threshold that is looser than the global threshold', () => {
        fuzzyErrorIndex.destroy();
        throttleCache.clear();

        const options = combineThrottleThreshold(
            {
                throttleThreshold: 2,
                disableThrottleLog: true,
            },
            999,
        );
        const event = {
            message: 'loose per-call threshold message alpha beta gamma',
        };

        const results = [
            isThrottled(event, undefined, options),
            isThrottled(event, undefined, options),
            isThrottled(event, undefined, options),
        ];

        assert.deepEquals(results, [
            false,
            false,
            true,
        ]);
    });
});
