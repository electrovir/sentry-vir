import {assert} from '@augment-vir/assert';
import {getEnumValues} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {sentryDepByEnv} from './auto.js';
import {SentryExecutionEnvEnum} from './env/execution-env.js';

describe('sentryDepByEnv', () => {
    it('includes an entry for each execution env', () => {
        assert.hasKeys(sentryDepByEnv, getEnumValues(SentryExecutionEnvEnum));
    });
});
