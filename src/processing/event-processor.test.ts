import {describe, itCases} from '@augment-vir/test';
import {EventSeverityEnum} from '../event-context/event-severity.js';
import {extraEventContextSymbol} from '../event-context/extra-event-context.js';
import {processSentryEvent} from './event-processor.js';

describe(processSentryEvent.name, () => {
    itCases(processSentryEvent, [
        {
            it: 'creates a Sentry context',
            inputs: [
                {
                    message: 'original message',
                    level: EventSeverityEnum.Warning,
                },
                {
                    originalException: {
                        [extraEventContextSymbol]: {myExtraContext: 'hello'},
                    },
                },
            ],
            expect: {
                message: 'original message',
                level: EventSeverityEnum.Warning,
                extra: {
                    originalFullMessage: 'original message',
                    myExtraContext: 'hello',
                },
            },
        },
        {
            it: 'includes output from context callback',
            inputs: [
                {
                    level: EventSeverityEnum.Error,
                },
                {
                    originalException: {
                        message: 'original message',
                        [extraEventContextSymbol]: {myExtraContext: 'hello'},
                    },
                },
                () => {
                    return {moreData: 'hello 2'};
                },
            ],
            expect: {
                level: EventSeverityEnum.Error,
                extra: {
                    originalFullMessage: 'original message',
                    myExtraContext: 'hello',
                    moreData: 'hello 2',
                },
            },
        },
    ]);
});
