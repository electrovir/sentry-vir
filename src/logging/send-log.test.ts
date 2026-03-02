import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {type CaptureContext, type Event as SentryEvent, type SeverityLevel} from '@sentry/core';
import {sendLog} from './send-log.js';
import {
    setSentryClientForLogging,
    type SentryClientForLogging,
} from './sentry-client-for-logging.js';

function createMockSentryClient() {
    const capturedMessages: {
        message: string;
        captureContext: CaptureContext | SeverityLevel | undefined;
    }[] = [];
    const capturedEvents: SentryEvent[] = [];

    const mockClient: SentryClientForLogging = {
        captureMessage(message: string, captureContext?: CaptureContext | SeverityLevel) {
            capturedMessages.push({
                message,
                captureContext,
            });
            return 'mock-message-id';
        },
        captureException() {
            return 'mock-exception-id';
        },
        captureEvent(event) {
            capturedEvents.push(event);
            return 'mock-event-id';
        },
        setTags() {},
    };

    return {
        mockClient,
        capturedMessages,
        capturedEvents,
    };
}

describe('sendLog', () => {
    it('sends a string message via captureMessage', async () => {
        const {mockClient, capturedMessages} = createMockSentryClient();
        await setSentryClientForLogging(mockClient);

        sendLog.warning('test warning message', {
            context: {
                extra: 'data',
            },
        });

        assert.isLengthExactly(capturedMessages, 1);
        assert.strictEquals(capturedMessages[0].message, 'test warning message');
    });

    it('sends an Error via captureMessage by extracting its message', async () => {
        const {mockClient, capturedMessages, capturedEvents} = createMockSentryClient();
        await setSentryClientForLogging(mockClient);

        sendLog.warning(new Error('error used as warning'), {
            context: {
                someContext: 'value',
            },
        });

        /**
         * The Error should be converted to a string and sent via captureMessage, not captureEvent.
         * This verifies the fix for the `<unlabeled event>` bug where Error.message (not
         * enumerable) was lost when spread into captureEvent.
         */
        assert.isLengthExactly(capturedMessages, 1);
        assert.isLengthExactly(capturedEvents, 0);
        assert.strictEquals(capturedMessages[0].message, 'error used as warning');
    });

    it('sends an Error via info severity', async () => {
        const {mockClient, capturedMessages} = createMockSentryClient();
        await setSentryClientForLogging(mockClient);

        sendLog.info(new Error('info error message'));

        assert.isLengthExactly(capturedMessages, 1);
        assert.strictEquals(capturedMessages[0].message, 'info error message');
    });

    it('sends a raw event object via captureEvent', async () => {
        const {mockClient, capturedMessages, capturedEvents} = createMockSentryClient();
        await setSentryClientForLogging(mockClient);

        sendLog.warning({message: 'raw event message'});

        assert.isLengthExactly(capturedMessages, 0);
        assert.isLengthExactly(capturedEvents, 1);
        assert.strictEquals(capturedEvents[0].message, 'raw event message');
    });
});
