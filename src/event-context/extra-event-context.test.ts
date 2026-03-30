import {ensureType} from '@augment-vir/common';
import {describe, itCases} from '@augment-vir/test';
import {ExtraContextError} from './extra-context.error.js';
import {
    extractExtraEventAttachments,
    extractExtraEventContext,
    extractExtraEventTags,
    extraEventAttachmentsSymbol,
    extraEventContextSymbol,
    extraEventTagsSymbol,
    hasExtraEventAttachments,
    hasExtraEventContext,
    hasExtraEventTags,
    type HasExtraAttachments,
    type HasExtraContext,
    type HasExtraTags,
} from './extra-event-context.js';

describe(extractExtraEventContext.name, () => {
    itCases(extractExtraEventContext, [
        {
            it: 'grabs context from extra context error',
            input: new ExtraContextError('test message', {
                context: {
                    otherStuff: 'hi',
                },
            }),
            expect: {
                otherStuff: 'hi',
            },
        },
        {
            it: 'grabs context from an ordinary object',
            input: {
                [extraEventContextSymbol]: {
                    otherObject: 'hi',
                },
            } as any,
            expect: {
                otherObject: 'hi',
            },
        },
        {
            it: 'grabs context from hint exception',
            input: {
                originalException: {
                    [extraEventContextSymbol]: {
                        otherObject: 'hi',
                    },
                },
            },
            expect: {
                otherObject: 'hi',
            },
        },
        {
            it: 'grabs capture context',
            input: {
                captureContext: {
                    extra: {
                        otherObject: 'hi',
                    },
                },
            },
            expect: {
                otherObject: 'hi',
            },
        },
        {
            it: 'returns undefined if no context found',
            input: {},
            expect: undefined,
        },
    ]);
});

describe(hasExtraEventContext.name, () => {
    itCases(hasExtraEventContext, [
        {
            it: 'finds context in an extra context error',
            input: new ExtraContextError('test message', {
                context: {
                    otherStuff: 'hi',
                },
            }),
            expect: true,
        },
        {
            it: 'finds no context',
            input: new ExtraContextError('test message', {}),
            expect: false,
        },
        {
            it: 'finds context in an ordinary object',
            input: ensureType<HasExtraContext>({
                [extraEventContextSymbol]: {
                    otherObject: 'hi',
                },
            }),
            expect: true,
        },
        {
            it: 'fails to find context in an object that lacks it',
            input: {
                stuff: 'hi',
            },
            expect: false,
        },
    ]);
});

describe(extractExtraEventTags.name, () => {
    itCases(extractExtraEventTags, [
        {
            it: 'grabs tags from extra context error',
            input: new ExtraContextError('test message', {
                tags: {
                    region: 'us-east',
                },
            }),
            expect: {
                region: 'us-east',
            },
        },
        {
            it: 'grabs tags from an ordinary object',
            input: {
                [extraEventTagsSymbol]: {
                    env: 'prod',
                },
            } as any,
            expect: {
                env: 'prod',
            },
        },
        {
            it: 'grabs tags from hint exception',
            input: {
                originalException: {
                    [extraEventTagsSymbol]: {
                        version: 42,
                    },
                },
            },
            expect: {
                version: 42,
            },
        },
        {
            it: 'returns undefined if no tags found',
            input: {},
            expect: undefined,
        },
    ]);
});

describe(hasExtraEventTags.name, () => {
    itCases(hasExtraEventTags, [
        {
            it: 'finds tags in an extra context error',
            input: new ExtraContextError('test message', {
                tags: {
                    region: 'us-east',
                },
            }),
            expect: true,
        },
        {
            it: 'finds tags in an ordinary object',
            input: ensureType<HasExtraTags>({
                [extraEventTagsSymbol]: {
                    env: 'prod',
                },
            }),
            expect: true,
        },
        {
            it: 'fails to find tags in an object that lacks them',
            input: {
                stuff: 'hi',
            },
            expect: false,
        },
    ]);
});

describe(extractExtraEventAttachments.name, () => {
    itCases(extractExtraEventAttachments, [
        {
            it: 'grabs attachments from extra context error',
            input: new ExtraContextError('test message', {
                attachments: [
                    {
                        filename: 'screenshot.png',
                        data: 'binary-data',
                        contentType: 'image/png',
                    },
                ],
            }),
            expect: [
                {
                    filename: 'screenshot.png',
                    data: 'binary-data',
                    contentType: 'image/png',
                },
            ],
        },
        {
            it: 'grabs attachments from an ordinary object',
            input: {
                [extraEventAttachmentsSymbol]: [
                    {
                        filename: 'log.txt',
                        data: 'log content',
                    },
                ],
            } as any,
            expect: [
                {
                    filename: 'log.txt',
                    data: 'log content',
                },
            ],
        },
        {
            it: 'grabs attachments from hint exception',
            input: {
                originalException: {
                    [extraEventAttachmentsSymbol]: [
                        {
                            filename: 'dom.html',
                            data: '<html></html>',
                            contentType: 'text/html',
                        },
                    ],
                },
            },
            expect: [
                {
                    filename: 'dom.html',
                    data: '<html></html>',
                    contentType: 'text/html',
                },
            ],
        },
        {
            it: 'returns undefined if no attachments found',
            input: {},
            expect: undefined,
        },
    ]);
});

describe(hasExtraEventAttachments.name, () => {
    itCases(hasExtraEventAttachments, [
        {
            it: 'finds attachments in an extra context error',
            input: new ExtraContextError('test message', {
                attachments: [
                    {
                        filename: 'file.txt',
                        data: 'content',
                    },
                ],
            }),
            expect: true,
        },
        {
            it: 'finds attachments in an ordinary object',
            input: ensureType<HasExtraAttachments>({
                [extraEventAttachmentsSymbol]: [
                    {
                        filename: 'file.txt',
                        data: 'content',
                    },
                ],
            }),
            expect: true,
        },
        {
            it: 'fails to find attachments in an object that lacks them',
            input: {
                stuff: 'hi',
            },
            expect: false,
        },
    ]);
});
