import {getEnumTypedValues} from '@augment-vir/common';
import {assert} from '@open-wc/testing';
import {sentryDepByEnv} from './auto';
import {SentryExecutionEnvEnum} from './env/execution-env';

describe('sentryDepByEnv', () => {
    it('includes an entry for each execution env', () => {
        assert.hasAllKeys(sentryDepByEnv, getEnumTypedValues(SentryExecutionEnvEnum));
    });
});
