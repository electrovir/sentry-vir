import {assertTypeOf, itCases} from '@augment-vir/browser-testing';
import {EventExtraContext, convertEventDetailsToSentryContext} from './event-context';
import {EventSeverityEnum} from './event-severity';

describe(convertEventDetailsToSentryContext.name, () => {
    itCases(convertEventDetailsToSentryContext, [
        {
            it: 'converts empty extra context',
            input: {
                severity: EventSeverityEnum.Fatal,
            },
            expect: {
                extra: {},
                level: 'fatal',
            },
        },
        {
            it: 'converts extra context',
            input: {
                severity: EventSeverityEnum.Fatal,
                extraContext: {
                    hi: 'what up',
                    anotherEntry: 'data here',
                },
            },
            expect: {
                extra: {
                    hi: 'what up',
                    anotherEntry: 'data here',
                },
                level: 'fatal',
            },
        },
    ]);
});

describe('EventExtraContext', () => {
    it('blocks non-json compatible values', () => {
        assertTypeOf({entry: new RegExp('hello')}).not.toMatchTypeOf<EventExtraContext>();
    });
});
