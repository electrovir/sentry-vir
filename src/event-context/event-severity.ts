import {isEnumValue} from '@augment-vir/common';
import type {Event as SentryEvent} from '@sentry/browser';

/** Mapped from Sentry's values into an enum for convenience of use. */
export enum EventSeverityEnum {
    Warning = 'warning',
    Info = 'info',
    Debug = 'debug',
    Fatal = 'fatal',
    Error = 'error',
}

/** Event severities that are not error-level. */
export type InfoEventSeverity =
    | EventSeverityEnum.Debug
    | EventSeverityEnum.Info
    | EventSeverityEnum.Warning;

const consoleLogMethodsPerSeverity: Record<EventSeverityEnum, (typeof console)['log']> = {
    [EventSeverityEnum.Warning]: console.warn,
    [EventSeverityEnum.Info]: console.info,
    [EventSeverityEnum.Debug]: console.debug,
    [EventSeverityEnum.Fatal]: console.error,
    [EventSeverityEnum.Error]: console.error,
};

/** Extracts the severity level from a sentry event while defaulting to an info level severity. */
export function extractEventSeverity(event: SentryEvent): EventSeverityEnum {
    if (!isEnumValue(event.level, EventSeverityEnum)) {
        return EventSeverityEnum.Info;
    }

    return event.level;
}

/**
 * Determines which console method should be used for local logging based on the given event's
 * severity.
 */
export function getConsoleMethodForSeverity(event: SentryEvent) {
    const severity = extractEventSeverity(event);

    return consoleLogMethodsPerSeverity[severity];
}
