/** Used to determine which Sentry client dependency to import. */
/* c8 ignore next */
export enum SentryExecutionEnvEnum {
    Browser = 'browser',
    Node = 'node',
}

/** The sentry dep import for each execution env. */
/* c8 ignore next 6 */
export const sentryDepByEnv = {
    /** Sentry client for the browser. */
    [SentryExecutionEnvEnum.Browser]: () => import('@sentry/browser'),
    /** Sentry client for the Node.js. */
    [SentryExecutionEnvEnum.Node]: () => import('@sentry/node'),
} as const satisfies Record<SentryExecutionEnvEnum, () => Promise<any>>;

/** Sentry client dependency used only in the browser. */
export type SentryBrowserDep = Awaited<
    ReturnType<(typeof sentryDepByEnv)[SentryExecutionEnvEnum.Browser]>
>;
/** Sentry client dependency used only in Node.js. */
export type SentryNodeDep = Awaited<
    ReturnType<(typeof sentryDepByEnv)[SentryExecutionEnvEnum.Node]>
>;
/** Any of the Sentry client dependencies. */
export type SentryDep = SentryBrowserDep | SentryNodeDep;
/** Pick a Sentry client dependency based on the given environment. */
export type SentryDepByEnv<Env extends SentryExecutionEnvEnum> =
    Env extends SentryExecutionEnvEnum.Browser ? SentryBrowserDep : SentryNodeDep;

/* c8 ignore next 6 */
/** Determine which Sentry client dependency to use and then import it. */
export async function getSentryByEnv<const Env extends SentryExecutionEnvEnum>(
    env: Env,
): Promise<SentryDepByEnv<Env>> {
    return (await sentryDepByEnv[env]()) as SentryDepByEnv<Env>;
}
