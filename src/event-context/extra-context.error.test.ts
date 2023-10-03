import {assertThrows} from '@augment-vir/browser-testing';
import {assert} from '@open-wc/testing';
import {ExtraContextError, throwWithExtraContext} from './extra-context.error';
import {hasExtraEventContext} from './extra-event-context';

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
        assertThrows(() => throwWithExtraContext('nothing burger', {stuff: 'hi'}));
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
