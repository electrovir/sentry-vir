import {
    type Attachment,
    type CaptureContext,
    type Scope,
    type Event as SentryEvent,
    type SeverityLevel,
} from '@sentry/core';
import {type SentryClientForLogging} from './sentry-client-for-logging.js';

/** Creates a Sentry client for logging that records everything sent to it instead of sending it. */
export function createMockSentryClient() {
    const capturedMessages: {
        message: string;
        captureContext: CaptureContext | SeverityLevel | undefined;
    }[] = [];
    const capturedEvents: SentryEvent[] = [];
    const capturedExceptions: unknown[] = [];
    const capturedAttachments: Attachment[] = [];
    const capturedContexts: {
        name: string;
        context: unknown;
    }[] = [];

    const mockClient: SentryClientForLogging = {
        captureMessage(message: string, captureContext?: CaptureContext | SeverityLevel) {
            capturedMessages.push({
                message,
                captureContext,
            });
            return 'mock-message-id';
        },
        captureException(exception: unknown) {
            capturedExceptions.push(exception);
            return 'mock-exception-id';
        },
        captureEvent(event) {
            capturedEvents.push(event);
            return 'mock-event-id';
        },
        setTags() {},
        withScope(
            ...args:
                | [
                      Scope | undefined,
                      (scope: Scope) => unknown,
                  ]
                | [(scope: Scope) => unknown]
        ) {
            const callback = args.length === 1 ? args[0] : args[1];
            const mockScope = {
                addAttachment(attachment: Attachment) {
                    capturedAttachments.push(attachment);
                    return mockScope;
                },
                setContext(name: string, context: unknown) {
                    capturedContexts.push({
                        name,
                        context,
                    });
                    return mockScope;
                },
            } as Scope;
            return callback(mockScope);
        },
    };

    return {
        mockClient,
        capturedMessages,
        capturedEvents,
        capturedExceptions,
        capturedAttachments,
        capturedContexts,
    };
}
