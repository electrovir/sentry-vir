import {itCases} from '@augment-vir/browser-testing';
import {SentryReleaseEnvEnum} from '../env/release-env';
import {createSentryHandler} from './handle-sentry-send';

describe(createSentryHandler.name, () => {
    const devHandler = createSentryHandler(SentryReleaseEnvEnum.Dev);
    const prodHandler = createSentryHandler(SentryReleaseEnvEnum.Prod);

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
