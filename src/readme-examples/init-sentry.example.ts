/**
 * If initializing sentry for node, instead import from 'sentry-vir/dist/esm/node' (for ESM) or
 * 'sentry-vir/dist/cjs/node' (for CommonJS).
 */
import {SentryReleaseEnvEnum} from 'sentry-vir';
import {initSentry} from 'sentry-vir/dist/esm/browser';

initSentry({
    dsn: 'Sentry project id provided by Sentry',
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
