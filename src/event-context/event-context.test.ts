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
        {
            it: 'includes tags when provided',
            inputs: [
                {
                    severity: EventSeverityEnum.Info,
                    extraContext: {
                        someData: 'value',
                    },
                    tags: {
                        region: 'us-east',
                        version: 42,
                        enabled: true,
                    },
                },
                {
                    wasSentPrematurely: false,
                },
            ],
            expect: {
                extra: {
                    someData: 'value',
                },
                level: 'info',
                tags: {
                    region: 'us-east',
                    version: 42,
                    enabled: true,
                },
            },
        },
        {
            it: 'omits tags key when tags are not provided',
            inputs: [
                {
                    severity: EventSeverityEnum.Debug,
                },
                {
                    wasSentPrematurely: false,
                },
            ],
            expect: {
                extra: {},
                level: 'debug',
            },
        },
    ]);
});

describe('EventExtraContext', () => {
    it('allows JSON compatible objects', () => {
        assert
            .tsType({
                entry: 'hello',
            })
            .matches<EventExtraContext>();
        assert
            .tsType({
                nested: {
                    value: 42,
                },
            })
            .matches<EventExtraContext>();
    });
});
