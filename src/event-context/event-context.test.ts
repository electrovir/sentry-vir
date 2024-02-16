import {itCases} from '@augment-vir/browser-testing';
import {assertTypeOf} from 'run-time-assertions';
import {EventExtraContext, convertEventDetailsToSentryContext} from './event-context';
import {EventSeverityEnum} from './event-severity';

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
        assertTypeOf({entry: new RegExp('hello')}).toMatchTypeOf<EventExtraContext>();
    });
});
