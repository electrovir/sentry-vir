/** Global kill switch state for all sentry-vir logging. */
let loggingDisabled = false;

/**
 * Globally enable or disable all sentry-vir logging. While disabled, `sendLog` and `handleError`
 * calls are dropped entirely (nothing is sent to Sentry, nothing is logged to the console, and
 * nothing is queued for a later send) and any events captured directly through the Sentry SDK
 * itself are dropped in `beforeSend`.
 *
 * This is also exposed as a method on the client returned from `initSentry` and can be set at init
 * time with the `disableLogging` init option.
 */
export function setLoggingDisabled(this: void, disabled: boolean) {
    loggingDisabled = disabled;
}

/** Whether {@link setLoggingDisabled} has currently disabled all sentry-vir logging. */
export function isLoggingDisabled() {
    return loggingDisabled;
}
