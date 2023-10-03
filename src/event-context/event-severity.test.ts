import {assertTypeOf} from '@augment-vir/browser-testing';
import {getEnumTypedValues} from '@augment-vir/common';
import {assert} from '@open-wc/testing';
import {
    EventSeverityEnum,
    InfoEventSeverity,
    extractEventSeverity,
    getConsoleMethodForSeverity,
} from './event-severity';

describe('InfoSeverity', () => {
    it('is a subset of EventSeverityEnum', () => {
        assertTypeOf<InfoEventSeverity>().toMatchTypeOf<EventSeverityEnum>();
    });
});

describe(extractEventSeverity.name, () => {
    it('extracts the severity level', () => {
        assert.strictEqual(extractEventSeverity({level: 'warning'}), EventSeverityEnum.Warning);
    });

    it('defaults to info level severity', () => {
        assert.strictEqual(extractEventSeverity({}), EventSeverityEnum.Info);
    });
});

describe(getConsoleMethodForSeverity.name, () => {
    it('has a console method for all severities', () => {
        const severities = getEnumTypedValues(EventSeverityEnum);

        assert.isAbove(severities.length, 1);

        severities.forEach((severity) => {
            assert.isDefined(getConsoleMethodForSeverity({level: severity}));
        });
    });
});
