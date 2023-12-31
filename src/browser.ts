import type {SentryBrowserDep} from './env/execution-env';
import {SentryExecutionEnvEnum} from './env/execution-env';
import {InitSentryInput, baseInitSentry} from './init-sentry/base-sentry-init';

export type Sentry = SentryBrowserDep;

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
}: Omit<InitSentryInput, 'executionEnv'>): Promise<Sentry> {
    const sentryDep = await import('@sentry/browser');

    await baseInitSentry({
        dsn,
        releaseEnv,
        releaseName,
        sentryConfigOverrides,
        createUniversalContext,
        sentryDep,
        executionEnv: SentryExecutionEnvEnum.Browser,
        isDev,
    });

    return sentryDep;
}
