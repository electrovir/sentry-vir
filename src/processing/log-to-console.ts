import {check, checkWrap} from '@augment-vir/assert';
import {omitObjectKeys} from '@augment-vir/common';
import {type EventHint} from '@sentry/browser';
import {type Event, type Extras} from '@sentry/core';
import {
    type EventSeverityEnum,
    consoleLogMethodPerSeverity,
    extractEventSeverity,
} from '../event-context/event-severity.js';
import {extractOriginalMessage} from './event-processor.js';

export enum LoggingState {
    Dev = 'dev',
    Prod = 'prod',
    NoSentryYet = 'no-sentry-yet',
}

export function logToConsoleFromSentry(
    /** The event from Sentry. */
    {
        event,
        hint,
        loggingState,
        silent,
    }: Readonly<{event: Event; hint: EventHint; loggingState: LoggingState; silent: boolean}>,
): void {
    if (silent) {
        return;
    }
    logToConsoleWithoutSentry(extractEventSeverity(event), loggingState, {
        event,
        extra: event.extra,
        hint,
        message: extractOriginalMessage(event, hint),
        originalException: hint.originalException,
    });
}

export function logToConsoleWithoutSentry(
    severity: EventSeverityEnum,
    loggingState: LoggingState,
    logData: {
        message: string;
        extra: undefined | Extras;
        event: Event | undefined;
        hint: EventHint | undefined;
        originalException: unknown;
    },
): void {
    const consoleMethod = consoleLogMethodPerSeverity[severity];

    const includedExtra: Extras | undefined = logData.extra
        ? checkWrap.isNotEmpty(omitObjectKeys(logData.extra, ['originalFullMessage']))
        : undefined;

    const logArgs = [
        logData.message,
        includedExtra,
        logData.originalException instanceof Error
            ? logData.originalException.stack
            : logData.originalException,
    ].filter(check.isTruthy);

    if (loggingState === LoggingState.Dev) {
        consoleMethod('Would have sent to Sentry:', ...logArgs);
    } else if (loggingState === LoggingState.Prod) {
        consoleMethod('Sending to Sentry:', ...logArgs);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (loggingState === LoggingState.NoSentryYet) {
        consoleMethod('Logging before Sentry init:', ...logArgs);
    }
}
