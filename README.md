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
-   Use `setLoggingDisabled` (on the client returned from `initSentry`, or imported directly) to globally turn all logging on or off.

## Basic setup example

<!-- example-link: src/readme-examples/init-sentry.example.ts -->

```TypeScript
/** If initializing sentry for node, instead import from 'sentry-vir/dist/node'. */
import {SentryReleaseEnvEnum} from 'sentry-vir';
import {initSentry} from 'sentry-vir/dist/browser';

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

## Globally disabling logging

`initSentry` returns the Sentry client with a `setLoggingDisabled` method attached. While logging is disabled, `sendLog` and `handleError` calls are dropped entirely (nothing is sent to Sentry, nothing is logged to the console, and nothing is buffered for a later send) and events captured directly through the Sentry SDK are dropped as well. Set `disableLogging: true` in the `initSentry` input to start out disabled.

The same control is available as the exported `setLoggingDisabled` and `isLoggingDisabled` functions, for code that doesn't have the client on hand.

<!-- example-link: src/readme-examples/disable-logging.example.ts -->

```TypeScript
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
```

## Logging example

<!-- example-link: src/readme-examples/setup-logging.example.ts -->

```TypeScript
import {SentryReleaseEnvEnum, handleError, sendLog, throwWithExtraContext} from 'sentry-vir';
import {initSentry} from 'sentry-vir/dist/browser.js';

sendLog.info('starting file');
/** Extra log context and tags can be added as the second argument to a sendLog method. */
sendLog.info('starting file 2', {context: {addExtraContext: 'here'}});
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
/** Extra error context and tags can be added as the second argument to handleError. */
handleError(new Error('test error 2'), {context: {addExtraContext: 'here'}});
/** These will be included in the Sentry buffer even if initSentry has not been awaited yet. */
handleError(new Error('test error 2'), {context: {addExtraContext: 'here'}});

/** Throw an error with extra context and tags attached for Sentry to pick up. */
throwWithExtraContext(new Error('final error'), {context: {addExtraContext: 'here'}});
```
