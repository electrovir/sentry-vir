import {initSentry} from 'sentry-vir/dist/esm/browser';
import {SentryReleaseEnvEnum, handleError, sendLog, throwWithExtraContext} from '..';

sendLog.info('starting file');
/** Extra log context can be added as the second argument to a sendLog method. */
sendLog.info('starting file 2', {addExtraContext: 'here'});
/** Other severities are covered. */
sendLog.debug('debug log');
/** Logs and errors will be buffered so it's safe to call this before initSentry has been called. */
sendLog.warning('warning log');

/** Standard init. Note that this returns a promise. */
initSentry({
    dsn: 'Sentry project id provided by Sentry',
    releaseEnv: SentryReleaseEnvEnum.Dev,
    releaseName: 'my release',
    createUniversalContext() {
        return {
            /** Or any other desired extra context. */
            userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
    },
});

handleError(new Error('test error'));
/** Extra error context can be added as the second argument to handleError. */
handleError(new Error('test error 2'), {addExtraContext: 'here'});
/** These will be included in the Sentry buffer even if initSentry has not been awaited yet. */
handleError(new Error('test error 2'), {addExtraContext: 'here'});

/** Throw an error with extra context attached for Sentry to pick up. */
throwWithExtraContext(new Error('final error'), {addExtraContext: 'here'});
