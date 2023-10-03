import {SentryExecutionEnvEnum, SentryReleaseEnvEnum, initSentry} from '..';

initSentry({
    dsn: 'Sentry project id provided by Sentry',
    executionEnv: SentryExecutionEnvEnum.Browser,
    releaseEnv: SentryReleaseEnvEnum.Dev,
    releaseName: 'my release',
    /** Optional. */
    createUniversalContext() {
        return {
            /** Or any other desired extra context. */
            userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
    },
});
