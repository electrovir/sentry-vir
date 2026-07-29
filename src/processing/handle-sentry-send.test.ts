import {assert} from '@augment-vir/assert';
import {applyBrand} from '@augment-vir/common';
import {describe, it, itCases} from '@augment-vir/test';
import {getNowInUtcTimezone} from 'date-vir';
import {type FuzzyIndexKey} from 'fuzzy-vir';
import {setLoggingDisabled} from '../logging/logging-disabled.js';
import {createSentryHandler} from './handle-sentry-send.js';
import {fuzzyErrorIndex, throttleCache} from './throttling.js';

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

    it('drops events while logging is globally disabled', () => {
        fuzzyErrorIndex.destroy();
        throttleCache.clear();

        try {
            setLoggingDisabled(true);
            assert.isNull(
                prodHandler(
                    {
                        type: 'transaction',
                        message: 'disabled event',
                    },
                    {},
                ),
            );
        } finally {
            setLoggingDisabled(false);
        }

        assert.isNotNull(
            prodHandler(
                {
                    type: 'transaction',
                    message: 'disabled event',
                },
                {},
            ),
        );
    });

    it('returns null on throttle', () => {
        fuzzyErrorIndex.destroy();
        throttleCache.clear();
        throttleCache.set(applyBrand<FuzzyIndexKey>('errorName'), {
            intervalCount: 1000,
            intervalStartAt: getNowInUtcTimezone(),
        });

        assert.isNull(
            prodHandler(
                {
                    type: 'transaction',
                    message: 'errorName',
                },
                {},
            ),
        );
    });
});
