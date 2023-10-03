import type {Options} from '@sentry/types';
import {SentryDep, SentryExecutionEnvEnum} from '../env/execution-env';
import {SentryReleaseEnvEnum} from '../env/release-env';
import {EventExtraContextCreator} from '../event-context/event-context';
import {processSentryEvent} from '../processing/event-processor';
import {UserOverrides, createSentryConfig} from '../processing/sentry-config';

/** Configuration for initializing Sentry. */
export type InitSentryInput = {
    /**
     * The release environment, prod vs dev rather than browser vs node. In dev, events won't be
     * sent to sentry. In both options, all events will be logged to the local console.
     */
    releaseEnv: SentryReleaseEnvEnum;
    /**
     * The environment wherein the Sentry client will execute. Used to determine which Sentry client
     * to load: browser or node.
     */
    executionEnv: SentryExecutionEnvEnum;
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
 * Base Sentry init. Requires the Sentry module to already have been imported. Setup a sentry client
 * with all the default sentry-vir integrations and configs.
 *
 * To override any default sentry-vir settings, include them in the userConfig input.
 */
/* c8 ignore next */
export async function baseInitSentry({
    dsn,
    releaseEnv,
    releaseName,
    sentryConfigOverrides,
    createUniversalContext,
    sentryDep,
    executionEnv,
}: InitSentryInput & {sentryDep: SentryDep}) {
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