import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {handleError} from './handle-error.js';
import {setLoggingDisabled} from './logging-disabled.js';
import {setSentryClientForLogging} from './sentry-client-for-logging.js';
import {createMockSentryClient} from './sentry-client-for-logging.mock.js';

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
});
