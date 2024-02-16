import {assert} from '@open-wc/testing';
import {assertTypeOf} from 'run-time-assertions';
import {EventSeverityEnum, InfoEventSeverity, extractEventSeverity} from './event-severity';

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
