import {SentryExecutionEnvEnum} from './env/execution-env';
import {InitSentryInput} from './init-sentry/base-sentry-init';
import {createSentryConfig} from './init-sentry/sentry-config';
import {processSentryEvent} from './processing/event-processor';

/**
 * Base Sentry init. Requires the Sentry module to already have been imported. Setup a sentry client
 * with all the default sentry-vir integrations and configs.
 *
 * To override any default sentry-vir settings, include them in the userConfig input.
 */
/* c8 ignore next */
export async function initSentry({
    dsn,
    releaseEnv,
    releaseName,
    sentryConfigOverrides,
    createUniversalContext,
}: Omit<InitSentryInput, 'executionEnv'>) {
    const sentryDep = await import('@sentry/browser');

    const finalSentryConfig = await createSentryConfig(
        SentryExecutionEnvEnum.Browser,
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
