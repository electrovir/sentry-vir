import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {ExtraContextError, throwWithExtraContext} from './extra-context.error.js';
import {hasExtraEventContext} from './extra-event-context.js';

describe(ExtraContextError.name, () => {
    it('includes extra context', () => {
        assert.isTrue(
            hasExtraEventContext(
                new ExtraContextError(
                    'yo',
                    /** Even when the extra context is empty. */
                    {},
                ),
            ),
        );
    });
});

describe(throwWithExtraContext.name, () => {
    it('throws', () => {
        assert.throws(() => throwWithExtraContext('nothing burger', {stuff: 'hi'}));
    });

    it('includes extra context', () => {
        try {
            throwWithExtraContext('another attempt', {data: 'hello'});
            throw new Error('did not throw');
        } catch (error) {
            assert.isTrue(hasExtraEventContext(error));
        }
    });
});
