import {itCases} from '@augment-vir/browser-testing';
import {assertTypeOf} from 'run-time-assertions';
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
    it('allows anything', () => {
        assertTypeOf({entry: new RegExp('hello')}).toMatchTypeOf<EventExtraContext>();
    });
});
