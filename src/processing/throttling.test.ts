import {mapObjectValues} from '@augment-vir/common';
import {describe, itCases} from '@augment-vir/test';
import {calculateRelativeDate, type FullDate, getNowInUtcTimezone} from 'date-vir';
import {replaceObject} from '../augments/replace-object.js';
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
        initThrottleCache: typeof throttleCache,
        ...params: Parameters<typeof shouldThrottleEvent>
    ) {
        replaceObject(throttleCache, initThrottleCache);
        const isThrottled = shouldThrottleEvent(...params);
        return {
            isThrottled,
            throttleCache: mapObjectValues(throttleCache, (key, value) => {
                return {
                    intervalCount: value.intervalCount,
                    throttleStartedAt: !!value.throttleStartedAt,
                } satisfies TestThrottleCacheEntry;
            }),
        };
    }
    const now = getNowInUtcTimezone();

    itCases(testShouldThrottle, [
        {
            it: 'does not throttle on empty cache',
            inputs: [
                {},
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
                {
                    errorName: {
                        intervalCount: 100,
                        intervalStartAt: now,
                        throttleStartedAt: undefined,
                    },
                },
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
                {
                    errorName: {
                        intervalCount: 100,
                        intervalStartAt: now,
                        throttleStartedAt: undefined,
                    },
                },
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
                {
                    errorName: {
                        intervalCount: 10,
                        intervalStartAt: calculateRelativeDate(now, {hours: -2}),
                        throttleStartedAt: calculateRelativeDate(now, {days: -2}),
                    },
                },
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
                {
                    errorName: {
                        intervalCount: 200,
                        intervalStartAt: calculateRelativeDate(now, {hours: -2}),
                        throttleStartedAt: calculateRelativeDate(now, {days: -3}),
                    },
                },
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
                {
                    errorName: {
                        intervalCount: 200,
                        intervalStartAt: calculateRelativeDate(now, {hours: -10}),
                        throttleStartedAt: undefined,
                    },
                },
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
                {},
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
