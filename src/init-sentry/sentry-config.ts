import {mergeDeep} from '@augment-vir/common';
import {type BrowserOptions} from '@sentry/browser';
import {type ErrorEvent, type Options, type TransactionEvent} from '@sentry/core';
import {type NodeOptions} from '@sentry/node';
import {
    type SentryBrowserDep,
    type SentryDepByEnv,
    SentryExecutionEnvEnum,
    type SentryNodeDep,
} from '../env/execution-env.js';
import {createSentryHandler} from '../processing/handle-sentry-send.js';

/** Optional UserOverrides of Sentry config values. */
export type UserOverrides = Omit<Partial<Options>, keyof RequiredSentryOptions> | undefined;
/** Sentry config options that are required. */
export type RequiredSentryOptions = Pick<Required<Options>, 'dsn' | 'environment' | 'release'>;

/** Creates the sentry config used internally by sentry-vir. */
export function createSentryConfig<const ExecutionEnv extends SentryExecutionEnvEnum>(
    executionEnv: ExecutionEnv,
    sentryDep: SentryDepByEnv<ExecutionEnv>,
    requiredSentryOptions: RequiredSentryOptions,
    userOverrides: UserOverrides,
    isDev: boolean,
): Promise<BrowserOptions | NodeOptions> {
    const sharedSentryConfig: Partial<Options> = {
        beforeSend: createSentryHandler<ErrorEvent>(isDev),
        beforeSendTransaction: createSentryHandler<TransactionEvent>(isDev),
        defaultIntegrations: false,
        enabled: true,
        maxValueLength: 10_000,
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
                BrowserSentry.httpContextIntegration(),
                BrowserSentry.dedupeIntegration(),
                BrowserSentry.eventFiltersIntegration(),
                BrowserSentry.functionToStringIntegration(),
                BrowserSentry.globalHandlersIntegration(),
            ],
        };

        return options;
    },
    [SentryExecutionEnvEnum.Node](NodeSentry: SentryNodeDep): NodeOptions {
        const options: BrowserOptions = {
            integrations: [
                NodeSentry.onUncaughtExceptionIntegration(),
                NodeSentry.onUnhandledRejectionIntegration(),
                NodeSentry.contextLinesIntegration(),
                NodeSentry.nodeContextIntegration(),
                NodeSentry.functionToStringIntegration(),
            ],
        };

        return options;
    },
};
