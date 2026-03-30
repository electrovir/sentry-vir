import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {ExtraContextError, throwWithExtraContext} from './extra-context.error.js';
import {
    hasExtraEventAttachments,
    hasExtraEventContext,
    hasExtraEventTags,
} from './extra-event-context.js';

describe(ExtraContextError.name, () => {
    it('includes extra context', () => {
        assert.isTrue(
            hasExtraEventContext(
                new ExtraContextError(
                    'yo',
                    /** Even when the extra context is empty. */
                    {
                        context: {},
                    },
                ),
            ),
        );
    });

    it('includes extra tags', () => {
        assert.isTrue(
            hasExtraEventTags(
                new ExtraContextError('yo', {
                    tags: {
                        region: 'us-east',
                    },
                }),
            ),
        );
    });

    it('does not include tags when none are provided', () => {
        assert.isFalse(
            hasExtraEventTags(
                new ExtraContextError('yo', {
                    context: {
                        data: 'hi',
                    },
                }),
            ),
        );
    });

    it('includes both context and tags', () => {
        const error = new ExtraContextError('yo', {
            context: {
                data: 'hi',
            },
            tags: {
                version: 5,
            },
        });
        assert.isTrue(hasExtraEventContext(error));
        assert.isTrue(hasExtraEventTags(error));
    });

    it('includes attachments', () => {
        assert.isTrue(
            hasExtraEventAttachments(
                new ExtraContextError('yo', {
                    attachments: [
                        {
                            filename: 'screenshot.png',
                            data: new Uint8Array([
                                1,
                                2,
                                3,
                            ]),
                            contentType: 'image/png',
                        },
                    ],
                }),
            ),
        );
    });

    it('does not include attachments when none are provided', () => {
        assert.isFalse(
            hasExtraEventAttachments(
                new ExtraContextError('yo', {
                    context: {
                        data: 'hi',
                    },
                }),
            ),
        );
    });
});

describe(throwWithExtraContext.name, () => {
    it('throws', () => {
        assert.throws(() =>
            throwWithExtraContext('nothing burger', {
                context: {
                    stuff: 'hi',
                },
            }),
        );
    });

    it('includes extra context', () => {
        try {
            throwWithExtraContext('another attempt', {
                context: {
                    data: 'hello',
                },
            });
            throw new Error('did not throw');
        } catch (error) {
            assert.isTrue(hasExtraEventContext(error));
        }
    });

    it('includes extra tags', () => {
        try {
            throwWithExtraContext('tag test', {
                tags: {
                    env: 'prod',
                },
            });
            throw new Error('did not throw');
        } catch (error) {
            assert.isTrue(hasExtraEventTags(error));
        }
    });

    it('includes both context and tags', () => {
        try {
            throwWithExtraContext('both test', {
                context: {
                    data: 'hello',
                },
                tags: {
                    env: 'prod',
                    count: 10,
                },
            });
            throw new Error('did not throw');
        } catch (error) {
            assert.isTrue(hasExtraEventContext(error));
            assert.isTrue(hasExtraEventTags(error));
        }
    });

    it('includes attachments', () => {
        try {
            throwWithExtraContext('attachment test', {
                attachments: [
                    {
                        filename: 'log.txt',
                        data: 'log content',
                        contentType: 'text/plain',
                    },
                ],
            });
            throw new Error('did not throw');
        } catch (error) {
            assert.isTrue(hasExtraEventAttachments(error));
        }
    });
});
