import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {type EventExtraContext, convertEventDetailsToSentryContext} from './event-context.js';
import {EventSeverityEnum} from './event-severity.js';

describe(convertEventDetailsToSentryContext.name, () => {
    itCases(convertEventDetailsToSentryContext, [
        {
            it: 'converts empty extra context',
            inputs: [
                {
                    severity: EventSeverityEnum.Fatal,
                },
                {
                    wasSentPrematurely: false,
                },
            ],
            expect: {
                extra: {},
                level: 'fatal',
            },
        },
        {
            it: 'converts extra context',
            inputs: [
                {
                    severity: EventSeverityEnum.Fatal,
                    extraContext: {
                        hi: 'what up',
                        anotherEntry: 'data here',
                    },
                },
                {
                    wasSentPrematurely: false,
                },
            ],
            expect: {
                extra: {
                    hi: 'what up',
                    anotherEntry: 'data here',
                },
                level: 'fatal',
            },
        },
        {
            it: 'handles wasSentPrematurely set to true',
            inputs: [
                {
                    severity: EventSeverityEnum.Fatal,
                    extraContext: {
                        hi: 'what up',
                        anotherEntry: 'data here',
                    },
                },
                {
                    wasSentPrematurely: true,
                },
            ],
            expect: {
                extra: {
                    hi: 'what up',
                    anotherEntry: 'data here',
                    wasSentPrematurely: true,
                },
                level: 'fatal',
            },
        },
    ]);
});

describe('EventExtraContext', () => {
    it('allows anything', () => {
        assert.tsType({entry: new RegExp('hello')}).matches<EventExtraContext>();
    });
});
