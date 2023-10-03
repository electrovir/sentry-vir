import {getEnumTypedValues} from '@augment-vir/common';
import {assert} from '@open-wc/testing';
import {SentryExecutionEnvEnum, sentryDepByEnv} from './execution-env';

describe('sentryDepByEnv', () => {
    it('includes an entry for each execution env', () => {
        assert.hasAllKeys(sentryDepByEnv, getEnumTypedValues(SentryExecutionEnvEnum));
    });
});
