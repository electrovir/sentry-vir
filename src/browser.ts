import {type SentryBrowserDep, SentryExecutionEnvEnum} from './env/execution-env.js';
import {
    type InitSentryInput,
    type SentryVirClient,
    baseInitSentry,
    createSentryVirClient,
} from './init-sentry/base-sentry-init.js';

export type SentryBrowserClient = SentryVirClient<SentryBrowserDep>;

/**
 * Base Sentry init. Requires the Sentry module to already have been imported. Setup a sentry client
 * with all the default sentry-vir integrations and configs.
 *
 * To override any default sentry-vir settings, include them in the userConfig input.
 */
export async function initSentry({
    dsn,
    releaseEnv,
    releaseName,
    sentryConfigOverrides,
    createUniversalContext,
    isDev,
    silent,
    disableLogging,
    throttleOptions,
}: Omit<InitSentryInput, 'executionEnv'>): Promise<SentryBrowserClient> {
    const sentryDep: SentryBrowserDep = await import('@sentry/browser');

    await baseInitSentry({
        dsn,
        releaseEnv,
        releaseName,
        sentryConfigOverrides,
        createUniversalContext,
        sentryDep,
        executionEnv: SentryExecutionEnvEnum.Browser,
        isDev,
        silent,
        disableLogging,
        throttleOptions,
    });

    return createSentryVirClient(sentryDep);
}
