import {itCases} from '@augment-vir/browser-testing';
import {createSentryHandler} from './handle-sentry-send';

describe(createSentryHandler.name, () => {
    const devHandler = createSentryHandler(true);
    const prodHandler = createSentryHandler(false);

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
