import {sendLog} from 'sentry-vir';
import {initSentry} from 'sentry-vir/dist/browser.js';

const sentry = await initSentry({
    dsn: 'Sentry project id provided by Sentry',
    releaseEnv: 'dev',
    releaseName: 'my release',
    isDev: false,
    /** Optional: start with all logging disabled. */
    disableLogging: true,
});

/** Dropped: nothing is sent to Sentry and nothing is logged to the console. */
sendLog.info('not logged');

sentry.setLoggingDisabled(false);

/** Handled normally now. */
sendLog.info('logged');
