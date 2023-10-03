import {AnyFunction, MaybePromise, isRuntimeTypeOf} from '@augment-vir/common';
import type {Event as SentryEvent} from '@sentry/types';
import type {SentryDep} from '../env/execution-env';
import {
    EventDetails,
    EventExtraContext,
    convertEventDetailsToSentryContext,
} from '../event-context/event-context';
import {EventSeverityEnum, InfoEventSeverity} from '../event-context/event-severity';

/** The bare minimum Sentry client needed for logging events. */
export type SentryClientForLogging = Pick<
    SentryDep,
    'captureMessage' | 'captureException' | 'captureEvent'
>;
let sentryClientForLogging: SentryClientForLogging | undefined;

/** An event that was triggered before setSentryClientForLogging was called. */
export type PrematureEvent<EntryPointFunction extends AnyFunction = AnyFunction> = {
    entryPoint: EntryPointFunction;
    inputs: Parameters<EntryPointFunction>;
};

/**
 * Used to store events before the Sentry client is setup. This is exported for testing purposes
 * only, you don't need to do anything with this.
 */
export const prematureSentryEvents: PrematureEvent[] = [];

/**
 * Asynchronously set the Sentry client for logging. When this is called, any events that were
 * triggered beforehand are handled. Thus, this set can be done at any time, allowing for
 * asynchronous Sentry client setup but synchronous log and error handling.
 *
 * This should be called as soon as possible after you have a return value from initSentry.
 *
 * This can be safely called multiple times (to overwrite the previously set Sentry client) because
 * previous events won't be handled multiple times.
 */
export async function setSentryClientForLogging(client: MaybePromise<SentryClientForLogging>) {
    const hadClientBefore = !!sentryClientForLogging;

    sentryClientForLogging = await client;

    if (!hadClientBefore) {
        sendPrematureEvents();
    }
}

function sendPrematureEvents() {
    while (prematureSentryEvents.length) {
        try {
            const prematureLog = prematureSentryEvents.pop();
            if (!prematureLog) {
                return;
            }

            prematureLog.entryPoint(...prematureLog.inputs);
        } catch (caught) {
            console.error('error while trying to send sentry logs:', caught);
        }
    }
}

/** Record an error to Sentry without throwing it. */
export function handleError(error: unknown, extraContext?: EventExtraContext): string | undefined {
    try {
        if (!sentryClientForLogging) {
            prematureSentryEvents.push({
                entryPoint: handleError,
                inputs: [
                    error,
                    extraContext,
                ],
            });
            return undefined;
        }

        const scopeContext = convertEventDetailsToSentryContext({
            extraContext,
            severity: EventSeverityEnum.Error,
        });

        const eventId = sentryClientForLogging.captureException(error, scopeContext);
        return eventId;
    } catch (caught) {
        console.error('error while trying to handle error:', caught);
        return undefined;
    }
}

/** Send non-error events to Sentry. */
export const sendLog = {
    /** Sends an even to Sentry with debug severity. */
    [EventSeverityEnum.Debug]: wrapLogWithSeverity(EventSeverityEnum.Debug),
    /** Sends an even to Sentry with info severity. */
    [EventSeverityEnum.Info]: wrapLogWithSeverity(EventSeverityEnum.Info),
    /** Sends an even to Sentry with warning severity. */
    [EventSeverityEnum.Warning]: wrapLogWithSeverity(EventSeverityEnum.Warning),
} as const satisfies Record<
    InfoEventSeverity,
    (
        ...args: Parameters<ReturnType<typeof wrapLogWithSeverity>>
    ) => ReturnType<typeof sendLogToSentry>
>;

function wrapLogWithSeverity(severity: EventSeverityEnum) {
    return (info: Parameters<typeof sendLogToSentry>[0], extraContext?: EventExtraContext) => {
        return sendLogToSentry(info, {
            extraContext,
            severity,
        });
    };
}

function sendLogToSentry(
    logInfo: string | Omit<SentryEvent, 'extra' | 'level'>,
    eventDetails: EventDetails,
): string | undefined {
    try {
        if (!sentryClientForLogging) {
            prematureSentryEvents.push({
                entryPoint: sendLogToSentry,
                inputs: [
                    logInfo,
                    eventDetails,
                ],
            });
            return undefined;
        }

        const scopeContext = convertEventDetailsToSentryContext(eventDetails);

        const eventId: string = isRuntimeTypeOf(logInfo, 'string')
            ? sentryClientForLogging.captureMessage(logInfo, scopeContext)
            : sentryClientForLogging.captureEvent({
                  ...logInfo,
                  ...scopeContext,
              });

        return eventId;
    } catch (caught) {
        console.error('error while trying to send log:', caught);
        return undefined;
    }
}
