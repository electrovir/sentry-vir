/**
 * Used to determine logging behavior (dev does not send events to Sentry but still logs them
 * locally).
 */
export enum SentryReleaseEnvEnum {
    Prod = 'prod',
    Dev = 'dev',
}
