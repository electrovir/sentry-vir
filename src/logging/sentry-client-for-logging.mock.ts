import * as sentryBrowserDep from '@sentry/browser';
import {
    type Attachment,
    type CaptureContext,
    createTransport,
    type ErrorEvent,
    type Scope,
    type Event as SentryEvent,
    type SeverityLevel,
} from '@sentry/core';
import {SentryExecutionEnvEnum} from '../env/execution-env.js';
import {baseInitSentry} from '../init-sentry/base-sentry-init.js';
import {
    type SentryClientForLogging,
    setSentryClientForLogging,
} from './sentry-client-for-logging.js';

/**
 * Initializes a real Sentry browser client through sentry-vir's own init, so events run through
 * Sentry's capture pipeline and sentry-vir's event processor. Events are recorded instead of sent.
 */
export async function initRecordingSentry() {
    const sentEvents: ErrorEvent[] = [];

    await baseInitSentry({
        dsn: 'https://public@example.com/1',
        releaseEnv: 'test',
        releaseName: 'test',
        isDev: false,
        silent: true,
        executionEnv: SentryExecutionEnvEnum.Browser,
        sentryDep: sentryBrowserDep,
        sentryConfigOverrides: {
            beforeSend(event) {
                sentEvents.push(event);
                return null;
            },
            transport(options) {
                return createTransport(options, () => {
                    return Promise.resolve({});
                });
            },
        },
    });
    /** `baseInitSentry` sets the logging client without awaiting it. */
    await setSentryClientForLogging(sentryBrowserDep);

    return {
        sentEvents,
        async flush() {
            await sentryBrowserDep.flush();
        },
    };
}

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
