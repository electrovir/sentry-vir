import {type PartialWithUndefined} from '@augment-vir/common';
import {type Options} from '@sentry/core';
import {type SentryDep, type SentryExecutionEnvEnum} from '../env/execution-env.js';
import {type EventExtraContextCreator} from '../event-context/event-context.js';
import {setSentryClientForLogging} from '../logging/sentry-client-for-logging.js';
import {processSentryEvent} from '../processing/event-processor.js';
import {type ThrottleOptions} from '../processing/throttling.js';
import {type UserOverrides, createSentryConfig} from './sentry-config.js';

/** Configuration for initializing Sentry. */
export type InitSentryInput = {
    /** The release environment, rather than the execution environment (browser vs node). */
    releaseEnv: string;
    /**
     * In dev, events won't be sent to sentry. In either case, events will be logged to the local
     * console.
     */
    isDev: boolean;
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
     * Set to `true` to disable all logging output to the console.
     *
     * @default false
     */
    silent?: boolean | undefined;
    /**
     * Optionally create extra context to be included in all Sentry events. This will execute for
     * each event that is processed.
     */
    createUniversalContext?: EventExtraContextCreator | undefined;
    /** Optionally override any Sentry config properties that this package sets. */
    sentryConfigOverrides?: UserOverrides;
    throttleOptions?: Readonly<PartialWithUndefined<ThrottleOptions>> | undefined;
};

/**
 * Base Sentry init. Requires the Sentry module to already have been imported. Setup a sentry client
 * with all the default sentry-vir integrations and configs.
 *
 * To override any default sentry-vir settings, include them in the userConfig input.
 */
export async function baseInitSentry({
    dsn,
    releaseEnv,
    releaseName,
    sentryConfigOverrides,
    createUniversalContext,
    sentryDep,
    executionEnv,
    isDev,
    silent,
    throttleOptions,
}: InitSentryInput & {sentryDep: SentryDep}) {
    const finalSentryConfig = await createSentryConfig({
        executionEnv,
        sentryDep,
        requiredSentryOptions: {
            dsn,
            environment: releaseEnv,
            release: releaseName,
        },
        userOverrides: sentryConfigOverrides,
        flagParams: {
            isDev,
            isSilent: !!silent,
            throttleOptions,
        },
    });

    sentryDep.init(finalSentryConfig);
    sentryDep.addEventProcessor((event, hint) =>
        processSentryEvent(event, hint, createUniversalContext),
    );

    void setSentryClientForLogging(sentryDep);
    return sentryDep;
}
