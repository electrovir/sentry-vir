import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {calculateRelativeDate, getNowInUtcTimezone} from 'date-vir';
import {createSentryHandler} from './handle-sentry-send.js';
import {throttleCache} from './throttling.js';

describe(createSentryHandler.name, () => {
    const devHandler = createSentryHandler({
        isDev: true,
        isSilent: false,
        throttleOptions: undefined,
    });
    const prodHandler = createSentryHandler({
        isDev: false,
        isSilent: false,
        throttleOptions: undefined,
    });

    itCases(devHandler, [
        {
            it: 'returns null',
            inputs: [
                {
                    type: 'transaction',
                },
                {},
            ],
            expect: null,
        },
    ]);

    itCases(prodHandler, [
        {
            it: 'returns the event',
            inputs: [
                {
                    type: 'transaction',
                    message: 'errorName',
                },
                {},
            ],
            expect: {
                type: 'transaction',
                message: 'errorName',
            },
        },
        {
            it: 'returns null on throttle',
            inputs: [
                {
                    type: 'transaction',
                },
                {},
            ],
            expect: {
                type: 'transaction',
            },
        },
    ]);

    it('returns null on throttle', () => {
        throttleCache.clear();
        throttleCache.set('errorName', {
            intervalCount: 1000,
            intervalStartAt: calculateRelativeDate(getNowInUtcTimezone(), {hours: -2}),
            throttleStartedAt: undefined,
        });

        assert.isNull(prodHandler({type: 'transaction', message: 'errorName'}, {}));
    });
});
