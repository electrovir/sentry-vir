/**
 * Used to determine which Sentry client dependency to import.
 *
 * @category Internal
 */
export enum SentryExecutionEnvEnum {
    Browser = 'browser',
    Node = 'node',
}

/**
 * Sentry client dependency used only in the browser.
 *
 * @category Internal
 */
export type SentryBrowserDep = typeof import('@sentry/browser');
/**
 * Sentry client dependency used only in Node.js.
 *
 * @category Internal
 */
export type SentryNodeDep = typeof import('@sentry/node');
/**
 * Any of the Sentry client dependencies.
 *
 * @category Internal
 */
export type SentryDep = SentryBrowserDep | SentryNodeDep;

/**
 * Pick a Sentry client dependency based on the given environment.
 *
 * @category Internal
 */
export type SentryDepByEnv<ExecutionEnv extends SentryExecutionEnvEnum> =
    ExecutionEnv extends SentryExecutionEnvEnum.Browser ? SentryBrowserDep : SentryNodeDep;
