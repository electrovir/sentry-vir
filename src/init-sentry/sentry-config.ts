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
import {createSentryHandler} from '../processing/handle-sentry-send';

/** Optional UserOverrides of Sentry config values. */
export type UserOverrides = Omit<Partial<Options>, keyof RequiredSentryOptions> | undefined;
/** Sentry config options that are required. */
export type RequiredSentryOptions = Pick<Required<Options>, 'dsn' | 'environment' | 'release'>;

/** Creates the sentry config used internally by sentry-vir. */
export async function createSentryConfig<const ExecutionEnv extends SentryExecutionEnvEnum>(
    executionEnv: ExecutionEnv,
    sentryDep: SentryDepByEnv<ExecutionEnv>,
    requiredSentryOptions: RequiredSentryOptions,
    userOverrides: UserOverrides,
    isDev: boolean,
): Promise<SentryBrowserDep | SentryNodeDep> {
    const sharedSentryConfig: Partial<Options> = {
        beforeSend: createSentryHandler(isDev),
        beforeSendTransaction: createSentryHandler(isDev),
        defaultIntegrations: false,
        enabled: true,
    };

    const envSentryConfig = sentryConfigByEnv[executionEnv](
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
        userOverrides || {},
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
