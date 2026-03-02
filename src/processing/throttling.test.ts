import {describe, itCases} from '@augment-vir/test';
import {calculateRelativeDate, type FullDate, getNowInUtcTimezone} from 'date-vir';
import {shouldThrottleEvent, throttleCache, type ThrottleCacheEntry} from './throttling.js';

describe(shouldThrottleEvent.name, () => {
    type TestThrottleCacheEntry = {
        [Key in keyof Omit<ThrottleCacheEntry, 'intervalStartAt'>]: Extract<
            ThrottleCacheEntry[Key],
            FullDate
        > extends never
            ? ThrottleCacheEntry[Key]
            : boolean;
    };

    function testShouldThrottle(
        initThrottleCache: Map<string, ThrottleCacheEntry>,
        ...params: Parameters<typeof shouldThrottleEvent>
    ) {
        throttleCache.clear();
        for (const [
            key,
            value,
        ] of initThrottleCache) {
            throttleCache.set(key, value);
        }
        const isThrottled = shouldThrottleEvent(...params);
        const throttleCacheResult: Record<string, TestThrottleCacheEntry> = {};
        for (const [
            key,
            value,
        ] of throttleCache) {
            throttleCacheResult[key] = {
                intervalCount: value.intervalCount,
                throttleStartedAt: !!value.throttleStartedAt,
            };
        }
        return {
            isThrottled,
            throttleCache: throttleCacheResult,
        };
    }
    const now = getNowInUtcTimezone();

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
                        throttleStartedAt: false,
                    },
                },
            },
        },
        {
            it: 'starts throttling when threshold surpassed for the first time',
            inputs: [
                new Map([
                    [
                        'errorName',
                        {
                            intervalCount: 100,
                            intervalStartAt: now,
                            throttleStartedAt: undefined,
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
                        intervalCount: 101,
                        throttleStartedAt: true,
                    },
                },
            },
        },
        {
            it: 'does nothing when disabled',
            inputs: [
                new Map([
                    [
                        'errorName',
                        {
                            intervalCount: 100,
                            intervalStartAt: now,
                            throttleStartedAt: undefined,
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
                        intervalCount: 100,
                        throttleStartedAt: false,
                    },
                },
            },
        },
        {
            it: 'resets when interval elapsed and threshold not surpassed',
            inputs: [
                new Map([
                    [
                        'errorName',
                        {
                            intervalCount: 10,
                            intervalStartAt: calculateRelativeDate(now, {
                                hours: -2,
                            }),
                            throttleStartedAt: calculateRelativeDate(now, {
                                days: -2,
                            }),
                        },
                    ],
                ]),
                {
                    message: 'errorName',
                },
            ],
            expect: {
                isThrottled: false,
                throttleCache: {
                    errorName: {
                        intervalCount: 0,
                        throttleStartedAt: false,
                    },
                },
            },
        },
        {
            it: 'maintains throttle if interval is surpassed again',
            inputs: [
                new Map([
                    [
                        'errorName',
                        {
                            intervalCount: 200,
                            intervalStartAt: calculateRelativeDate(now, {
                                hours: -2,
                            }),
                            throttleStartedAt: calculateRelativeDate(now, {
                                days: -3,
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
                isThrottled: true,
                throttleCache: {
                    errorName: {
                        intervalCount: 0,
                        throttleStartedAt: true,
                    },
                },
            },
        },
        {
            it: 'does not record a throttle log when disabled',
            inputs: [
                new Map([
                    [
                        'errorName',
                        {
                            intervalCount: 200,
                            intervalStartAt: calculateRelativeDate(now, {
                                hours: -10,
                            }),
                            throttleStartedAt: undefined,
                        },
                    ],
                ]),
                {
                    message: 'errorName',
                },
                {},
                {
                    disableThrottleLog: false,
                },
            ],
            expect: {
                isThrottled: true,
                throttleCache: {
                    errorName: {
                        intervalCount: 0,
                        throttleStartedAt: true,
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
                        throttleStartedAt: false,
                    },
                },
            },
        },
    ]);
});
