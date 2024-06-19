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

/** Maps severities to the console methods used to log them. */
export const consoleLogMethodPerSeverity = {
    /** Maps to `console.warn`. */
    [EventSeverityEnum.Warning]: console.warn,
    /** Maps to `console.info`. */
    [EventSeverityEnum.Info]: console.info,
    /** Maps to `console.debug`. */
    [EventSeverityEnum.Debug]: console.debug,
    /** Maps to `console.error`. */
    [EventSeverityEnum.Fatal]: console.error,
    /** Maps to `console.error`. */
    [EventSeverityEnum.Error]: console.error,
} as const satisfies Readonly<Record<EventSeverityEnum, (typeof console)['log']>>;

/** Extracts the severity level from a sentry event while defaulting to an info level severity. */
export function extractEventSeverity(event: SentryEvent): EventSeverityEnum {
    if (!isEnumValue(event.level, EventSeverityEnum)) {
        return EventSeverityEnum.Info;
    }

    return event.level;
}
