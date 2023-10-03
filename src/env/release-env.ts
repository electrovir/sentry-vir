/**
 * Used to determine logging behavior (dev does not send events to Sentry but still logs them
 * locally).
 */
/* c8 ignore next */
export enum SentryReleaseEnvEnum {
    Prod = 'prod',
    Dev = 'dev',
}
