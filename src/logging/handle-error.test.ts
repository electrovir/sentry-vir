import {assert} from '@augment-vir/assert';
import {selectFrom} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {ExtraContextError, throwWithExtraContext} from '../event-context/extra-context.error.js';
import {attachSentryTags} from './attach-tags.js';
import {handleError} from './handle-error.js';
import {setLoggingDisabled} from './logging-disabled.js';
import {setSentryClientForLogging} from './sentry-client-for-logging.js';
import {createMockSentryClient, initRecordingSentry} from './sentry-client-for-logging.mock.js';

describe(handleError.name, () => {
    it('captures the error and returns its event id', async () => {
        const {mockClient, capturedExceptions} = createMockSentryClient();
        await setSentryClientForLogging(mockClient);

        const error = new Error('handled error');

        assert.strictEquals(handleError(error), 'mock-exception-id');
        assert.deepEquals(capturedExceptions, [error]);
    });

    it('captures nothing while logging is globally disabled', async () => {
        const {mockClient, capturedExceptions} = createMockSentryClient();
        await setSentryClientForLogging(mockClient);

        try {
            setLoggingDisabled(true);
            assert.isUndefined(handleError(new Error('suppressed error')));
            assert.isEmpty(capturedExceptions);
        } finally {
            setLoggingDisabled(false);
        }

        handleError(new Error('error after re-enabling'));
        assert.isLengthExactly(capturedExceptions, 1);
    });

    it('sends the tags from whichever call set them last', async () => {
        const recordingSentry = await initRecordingSentry();

        const error = new ExtraContextError('tagged error', {
            tags: {
                category: 'first',
                origin: 'first',
                untouched: 'first',
            },
        });
        assert.throws(() => {
            throwWithExtraContext(error, {
                tags: {
                    category: 'second',
                    origin: 'second',
                },
            });
        });
        handleError(error, {
            tags: {
                category: 'third',
            },
        });
        await recordingSentry.flush();

        assert.deepEquals(
            recordingSentry.sentEvents.map((event) => event.tags),
            [
                {
                    category: 'third',
                    origin: 'second',
                    untouched: 'first',
                },
            ],
        );
    });

    it('lets tags on the error override global tags', async () => {
        const recordingSentry = await initRecordingSentry();

        const error = new ExtraContextError('globally tagged error', {
            tags: {
                globalOverride: 'error',
            },
        });
        attachSentryTags({
            globalOverride: 'global',
            globalOnly: 'global',
        });
        handleError(error);
        await recordingSentry.flush();

        assert.deepEquals(
            recordingSentry.sentEvents.map((event) => {
                return selectFrom(event.tags || {}, {
                    globalOverride: true,
                    globalOnly: true,
                });
            }),
            [
                {
                    globalOverride: 'error',
                    globalOnly: 'global',
                },
            ],
        );
    });
});
