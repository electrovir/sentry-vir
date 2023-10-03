import type {Options} from '@sentry/types';
import {SentryExecutionEnvEnum, getSentryByEnv} from '../env/execution-env';
import {SentryReleaseEnvEnum} from '../env/release-env';
import {EventExtraContextCreator} from '../event-context/event-context';
import {processSentryEvent} from './event-processor';
import {UserOverrides, createSentryConfig} from './sentry-config';

/** Configuration for initializing Sentry. */
export type InitSentryInput = {
    /**
     * The environment wherein the Sentry client will execute. Used to determine which Sentry client
     * to load: browser or node.
     */
    executionEnv: SentryExecutionEnvEnum;
    /**
     * The release environment, prod vs dev rather than browser vs node. In dev, events won't be
     * sent to sentry. In both options, all events will be logged to the local console.
     */
    releaseEnv: SentryReleaseEnvEnum;
    /** Name for the current release. */
    releaseName: Required<Options>['release'];
    /** DSN needed for Sentry to hook up to your sentry project. */
    dsn: Required<Options>['dsn'];
    /**
     * Optionally create extra context to be included in all Sentry events. This will execute for
     * each event that is processed.
     */
    createUniversalContext?: EventExtraContextCreator | undefined;
    /** Optionally override any Sentry config properties that this package sets. */
    sentryConfigOverrides?: UserOverrides;
};

/**
 * Setup a sentry client with all the default sentry-vir integrations and configs.
 *
 * To override any default sentry-vir settings, include them in the userConfig input.
 */
/* c8 ignore next */
export async function initSentry({
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
