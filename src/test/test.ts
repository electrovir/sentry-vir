/** Run this by running `npm start` and opening the started frontend in a browser. */

import {initSentry} from '../browser.js';
import {handleError} from '../logging/handle-error.js';
import {sendLog} from '../logging/send-log.js';

function testErrors() {
    sendLog.info('hello there');
    throw new Error('blah');
}

declare const INJECTED_VITE_SECRETS: Readonly<{dsn: string}>;

async function main() {
    sendLog.info('hello there 1', {context: {extra: 'hi'}});
    handleError(new Error('blah'));
    await initSentry({
        dsn: INJECTED_VITE_SECRETS.dsn,
        isDev: true,
        releaseEnv: 'dev',
        releaseName: 'dev-123',
        throttleOptions: undefined,
    });

    testErrors();
}

await main();
