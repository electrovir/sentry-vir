import {type PartialWithUndefined} from '@augment-vir/common';
import {type Options} from '@sentry/core';
import {type SentryDep, type SentryExecutionEnvEnum} from '../env/execution-env.js';
import {type EventExtraContextCreator} from '../event-context/event-context.js';
import {setLoggingDisabled} from '../logging/logging-disabled.js';
import {setSentryClientForLogging} from '../logging/sentry-client-for-logging.js';
import {processSentryEvent} from '../processing/event-processor.js';
import {setActiveThrottleOptions, type ThrottleOptions} from '../processing/throttling.js';
import {createSentryConfig, type UserOverrides} from './sentry-config.js';

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
     * Set to `true` to start with all sentry-vir logging globally disabled. This can be changed at
     * any time afterwards with the `setLoggingDisabled` method on the client returned from
     * `initSentry`.
     *
     * @default false
     */
    disableLogging?: boolean | undefined;
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
 * The Sentry client returned by any of the init functions: the raw Sentry dep plus sentry-vir's own
 * additions.
 */
export type SentryVirClient<SpecificSentryDep extends SentryDep = SentryDep> = SpecificSentryDep & {
    /**
     * Globally enable or disable all sentry-vir logging. While disabled, `sendLog` and
     * `handleError` calls are dropped entirely (nothing is sent to Sentry, nothing is logged to the
     * console, and nothing is queued for a later send) and any events captured directly through the
     * Sentry SDK itself are dropped as well.
     */
    setLoggingDisabled: typeof setLoggingDisabled;
};

/** Combines a raw Sentry dep with sentry-vir's own client additions. */
export function createSentryVirClient<SpecificSentryDep extends SentryDep>(
    sentryDep: SpecificSentryDep,
): SentryVirClient<SpecificSentryDep> {
    /**
     * A module namespace object is non-extensible, so the additions have to go onto a copy of it.
     * Copying is safe because none of the Sentry exports read `this`.
     */
    return Object.assign({}, sentryDep, {
        setLoggingDisabled,
    }) satisfies SentryVirClient<SpecificSentryDep> as SentryVirClient<SpecificSentryDep>;
}

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
    disableLogging,
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

    setActiveThrottleOptions(throttleOptions);
    setLoggingDisabled(!!disableLogging);
    void setSentryClientForLogging(sentryDep);

    return createSentryVirClient(sentryDep);
}
