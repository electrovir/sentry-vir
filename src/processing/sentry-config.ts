import {mergeDeep} from '@augment-vir/common';
import type {BrowserOptions} from '@sentry/browser';
import type {NodeOptions} from '@sentry/node';
import type {Options} from '@sentry/types';
import {
    SentryBrowserDep,
    SentryDepByEnv,
    SentryExecutionEnvEnum,
    SentryNodeDep,
} from '../env/execution-env';
import {SentryReleaseEnvEnum} from '../env/release-env';
import {createSentryHandler} from './handle-sentry-send';

/** Optional UserOverrides of Sentry config values. */
export type UserOverrides = Omit<Partial<Options>, keyof RequiredSentryOptions> | undefined;
/** Sentry config options that are required. */
export type RequiredSentryOptions = Pick<Required<Options>, 'dsn' | 'environment' | 'release'>;

/** Creates the sentry config used internally by sentry-vir. */
// can't test config creation because it depends on execution environment
/* c8 ignore next 60 */
export async function createSentryConfig<const Env extends SentryExecutionEnvEnum>(
    env: Env,
    sentryDep: SentryDepByEnv<Env>,
    requiredSentryOptions: RequiredSentryOptions,
    userOverrides: UserOverrides,
    releaseEnv: SentryReleaseEnvEnum,
): Promise<SentryBrowserDep | SentryNodeDep> {
    const sharedSentryConfig: Partial<Options> = {
        beforeSend: createSentryHandler(releaseEnv),
        beforeSendTransaction: createSentryHandler(releaseEnv),
        defaultIntegrations: false,
        enabled: true,
    };

    const envSentryConfig = sentryConfigByEnv[env](
        /**
         * As cast needed because env and sentryDep are tightly coupled and there's not a good way
         * to check that they match with a type guard. This is okay, however, because the types of
         * this functions parameters already imposes the requirement that they are coupled.
         */
        sentryDep as any,
    );
    const combinedConfig = mergeDeep<any>(
        sharedSentryConfig,
        envSentryConfig,
        requiredSentryOptions,
        userOverrides,
    );
    return combinedConfig;
}

const sentryConfigByEnv = {
    [SentryExecutionEnvEnum.Browser](BrowserSentry: SentryBrowserDep): BrowserOptions {
        const options: BrowserOptions = {
            integrations: [
                new BrowserSentry.HttpContext(),
                new BrowserSentry.Dedupe(),
                new BrowserSentry.InboundFilters(),
                new BrowserSentry.FunctionToString(),
                new BrowserSentry.GlobalHandlers(),
            ],
        };

        return options;
    },
    [SentryExecutionEnvEnum.Node](NodeSentry: SentryNodeDep): NodeOptions {
        const options: BrowserOptions = {
            integrations: [
                new NodeSentry.Integrations.OnUncaughtException(),
                new NodeSentry.Integrations.OnUnhandledRejection(),
                new NodeSentry.Integrations.ContextLines(),
                new NodeSentry.Integrations.Context(),
                new NodeSentry.Integrations.FunctionToString(),
            ],
        };

        return options;
    },
};
