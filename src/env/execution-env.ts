/** Used to determine which Sentry client dependency to import. */
export enum SentryExecutionEnvEnum {
    Browser = 'browser',
    Node = 'node',
}

/** Sentry client dependency used only in the browser. */
export type SentryBrowserDep = typeof import('@sentry/browser');
/** Sentry client dependency used only in Node.js. */
export type SentryNodeDep = typeof import('@sentry/node');
/** Any of the Sentry client dependencies. */
export type SentryDep = SentryBrowserDep | SentryNodeDep;

/** Pick a Sentry client dependency based on the given environment. */
export type SentryDepByEnv<ExecutionEnv extends SentryExecutionEnvEnum> =
    ExecutionEnv extends SentryExecutionEnvEnum.Browser ? SentryBrowserDep : SentryNodeDep;
