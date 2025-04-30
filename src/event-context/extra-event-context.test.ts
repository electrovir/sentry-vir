import {ensureType} from '@augment-vir/common';
import {describe, itCases} from '@augment-vir/test';
import {ExtraContextError} from './extra-context.error.js';
import {
    extractExtraEventContext,
    extraEventContextSymbol,
    type HasExtraContext,
    hasExtraEventContext,
} from './extra-event-context.js';

describe(extractExtraEventContext.name, () => {
    itCases(extractExtraEventContext, [
        {
            it: 'grabs context from extra context error',
            input: new ExtraContextError('test message', {otherStuff: 'hi'}),
            expect: {
                otherStuff: 'hi',
            },
        },
        {
            it: 'grabs context from an ordinary object',
            input: {[extraEventContextSymbol]: {otherObject: 'hi'}} as any,
            expect: {
                otherObject: 'hi',
            },
        },
        {
            it: 'grabs context from hint exception',
            input: {originalException: {[extraEventContextSymbol]: {otherObject: 'hi'}}},
            expect: {
                otherObject: 'hi',
            },
        },
        {
            it: 'grabs capture context',
            input: {captureContext: {extra: {otherObject: 'hi'}}},
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
            input: new ExtraContextError('test message', {otherStuff: 'hi'}),
            expect: true,
        },
        {
            it: 'finds context in an ordinary object',
            input: ensureType<HasExtraContext>({[extraEventContextSymbol]: {otherObject: 'hi'}}),
            expect: true,
        },
        {
            it: 'fails to find context in an object that lacks it',
            input: {stuff: 'hi'},
            expect: false,
        },
    ]);
});
