import {SentryDep, SentryDepByEnv, SentryExecutionEnvEnum} from './env/execution-env';
import {InitSentryInput, baseInitSentry} from './init-sentry/base-sentry-init';

/** A function which imports a Sentry dep. */
export type SentryDepImporter = () => Promise<SentryDep>;

/** The sentry dep import for each execution env. */
export const sentryDepByEnv: Record<SentryExecutionEnvEnum, SentryDepImporter> = {
    /** Sentry client for the browser. */
    [SentryExecutionEnvEnum.Browser]: () => import('@sentry/browser'),
    /** Sentry client for the Node.js. */
    [SentryExecutionEnvEnum.Node]: () => import('@sentry/node'),
};

/** Determine which Sentry client dependency to use and then import it. */
async function getSentryByEnv<const Env extends SentryExecutionEnvEnum>(
    env: Env,
): Promise<SentryDepByEnv<Env>> {
    return (await sentryDepByEnv[env]()) as SentryDepByEnv<Env>;
}

/**
 * Automatically determines which Sentry module to import based on the given execution env. Warning:
 * using this function will likely cause both Sentry modules to be included in your bundles.
 *
 * Setup a Sentry client with all the default sentry-vir integrations and configs.
 *
 * To override any default sentry-vir settings, include them in the userConfig input.
 */
export async function autoInitSentry({
    executionEnv,
    dsn,
    releaseEnv,
    releaseName,
    sentryConfigOverrides,
    createUniversalContext,
}: InitSentryInput) {
    const sentryDep = await getSentryByEnv(executionEnv);

    await baseInitSentry({
        dsn,
        releaseEnv,
        releaseName,
        sentryConfigOverrides,
        createUniversalContext,
        sentryDep,
        executionEnv,
    });

    return sentryDep;
}
