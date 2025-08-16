import {describe, itCases} from '@augment-vir/test';
import {createSentryHandler} from './handle-sentry-send.js';

describe(createSentryHandler.name, () => {
    const devHandler = createSentryHandler({
        isDev: true,
        isSilent: false,
    });
    const prodHandler = createSentryHandler({
        isDev: false,
        isSilent: false,
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
                },
                {},
            ],
            expect: {
                type: 'transaction',
            },
        },
    ]);
});
