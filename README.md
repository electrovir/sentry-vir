# sentry-vir

Heroic and opinionated Sentry wrapper.

## Installation

```bash
npm i sentry-vir
```

## Usage

Full api reference: https://electrovir.github.io/sentry-vir

-   Use `initSentry` to initialize Sentry.
-   Use `sendLog` and `handleError` to send events to Sentry.
-   Use `setSentryClientForLogging` once `initSentry` has resolved to enable those events to send to Sentry.
    -   Note that `sendLog` and `handleError` _can_ be fired before `setSentryClientForLogging` has been called. Once `setSentryClientForLogging` has been called, it will catch up.
-   Use `throwWithExtraContext` to throw an error while attaching extra event context for Sentry to pick up.

## Basic setup example

<!-- example-link: src/readme-examples/init-sentry.example.ts -->

```TypeScript
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
```

## Logging example

<!-- example-link: src/readme-examples/setup-logging.example.ts -->

```TypeScript
import {
    SentryExecutionEnvEnum,
    SentryReleaseEnvEnum,
    handleError,
    initSentry,
    sendLog,
    setSentryClientForLogging,
    throwWithExtraContext,
} from '..';

sendLog.info('starting file');
/** Extra log context can be added as the second argument to a sendLog method. */
sendLog.info('starting file 2', {addExtraContext: 'here'});
/** Other severities are covered. */
sendLog.debug('debug log');
sendLog.warning('warning log');

/** Standard init. Note that this returns a promise. */
initSentry({
    dsn: 'Sentry project id provided by Sentry',
    executionEnv: SentryExecutionEnvEnum.Browser,
    releaseEnv: SentryReleaseEnvEnum.Dev,
    releaseName: 'my release',
    createUniversalContext() {
        return {
            /** Or any other desired extra context. */
            userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
    },
}).then((sentryClient) => {
    /**
     * This must be called at some point for all handleError and sendLog events to send to Sentry.
     * Note that sendLog and handleError can still be fired before setSentryClientForLogging is
     * called. Once setSentryClientForLogging is called, it'll catch up.
     */
    setSentryClientForLogging(sentryClient);
});

handleError(new Error('test error'));
/** Extra error context can be added as the second argument to handleError. */
handleError(new Error('test error 2'), {addExtraContext: 'here'});

/** Throw an error with extra context attached for Sentry to pick up. */
throwWithExtraContext(new Error('final error'), {addExtraContext: 'here'});
```
