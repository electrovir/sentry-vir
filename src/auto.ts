import {SentryDep, SentryDepByEnv, SentryExecutionEnvEnum} from './env/execution-env';
import {InitSentryInput} from './init-sentry/base-sentry-init';
import {createSentryConfig} from './init-sentry/sentry-config';
import {processSentryEvent} from './processing/event-processor';

/** A function which imports a Sentry dep. */
export type SentryDepImporter = () => Promise<SentryDep>;

/** The sentry dep import for each execution env. */
/* c8 ignore next 6 */
export const sentryDepByEnv: Record<SentryExecutionEnvEnum, SentryDepImporter> = {
    /** Sentry client for the browser. */
    [SentryExecutionEnvEnum.Browser]: () => import('@sentry/browser'),
    /** Sentry client for the Node.js. */
    [SentryExecutionEnvEnum.Node]: () => import('@sentry/node'),
};

/* c8 ignore next 6 */
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
/* c8 ignore next 30 */
export async function autoInitSentry({
    executionEnv,
    dsn,
    releaseEnv,
    releaseName,
    sentryConfigOverrides,
    createUniversalContext,
}: InitSentryInput) {
    const sentryDep = await getSentryByEnv(executionEnv);

    const finalSentryConfig = await createSentryConfig(
        executionEnv,
        sentryDep,
        {
            dsn,
            environment: releaseEnv,
            release: releaseName,
        },
        sentryConfigOverrides,
        releaseEnv,
    );

    sentryDep.init(finalSentryConfig);

    sentryDep.addGlobalEventProcessor((event, hint) =>
        processSentryEvent(event, hint, createUniversalContext),
    );

    return sentryDep;
}
