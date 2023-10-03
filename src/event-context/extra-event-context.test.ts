import {itCases} from '@augment-vir/browser-testing';
import {ensureType} from '@augment-vir/common';
import {ExtraContextError} from './extra-context.error';
import {
    extractExtraEventContext,
    extraEventContextSymbol,
    HasExtraContext,
    hasExtraEventContext,
} from './extra-event-context';

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
            input: ensureType<HasExtraContext>({[extraEventContextSymbol]: {otherObject: 'hi'}}),
            expect: {
                otherObject: 'hi',
            },
        },
        {
            it: 'returns undefined if no context found',
            input: {stuff: 'hi'},
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
