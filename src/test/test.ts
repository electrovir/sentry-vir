import {initSentry} from '../browser';
import {handleError} from '../logging/handle-error';
import {sendLog} from '../logging/send-log';

function testErrors() {
    sendLog.info('hello there');
    throw new Error('blah');
}

declare const INJECTED_VITE_SECRETS: Readonly<{dsn: string}>;

async function main() {
    sendLog.info('hello there 1', {context: 'hi'});
    handleError(new Error('blah'));
    await initSentry({
        dsn: INJECTED_VITE_SECRETS.dsn,
        isDev: true,
        releaseEnv: 'dev',
        releaseName: 'dev-123',
    });

    testErrors();
}

main();
