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
-   Use `throwWithExtraContext` to throw an error while attaching extra event context for Sentry to pick up.

## Basic setup example

<!-- example-link: src/readme-examples/init-sentry.example.ts -->

```TypeScript
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
```

## Logging example

<!-- example-link: src/readme-examples/setup-logging.example.ts -->

```TypeScript
import {SentryReleaseEnvEnum, handleError, sendLog, throwWithExtraContext} from 'sentry-vir';
import {initSentry} from 'sentry-vir/dist/esm/browser';

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
```
