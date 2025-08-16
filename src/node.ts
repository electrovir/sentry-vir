import {SentryExecutionEnvEnum, type SentryNodeDep} from './env/execution-env.js';
import {type InitSentryInput, baseInitSentry} from './init-sentry/base-sentry-init.js';

export type Sentry = SentryNodeDep;

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
}: Omit<InitSentryInput, 'executionEnv'>): Promise<SentryNodeDep> {
    const sentryDep = await import('@sentry/node');

    await baseInitSentry({
        dsn,
        releaseEnv,
        releaseName,
        sentryConfigOverrides,
        createUniversalContext,
        sentryDep,
        executionEnv: SentryExecutionEnvEnum.Node,
        isDev,
        silent,
    });

    return sentryDep;
}
