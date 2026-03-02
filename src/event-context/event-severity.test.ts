import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {EventSeverityEnum, type InfoEventSeverity, extractEventSeverity} from './event-severity.js';

describe('InfoSeverity', () => {
    it('is a subset of EventSeverityEnum', () => {
        assert.tsType<InfoEventSeverity>().matches<EventSeverityEnum>();
    });
});

describe(extractEventSeverity.name, () => {
    it('extracts the severity level', () => {
        assert.strictEquals(
            extractEventSeverity({
                level: 'warning',
            }),
            EventSeverityEnum.Warning,
        );
    });

    it('defaults to info level severity', () => {
        assert.strictEquals(extractEventSeverity({}), EventSeverityEnum.Info);
    });
});
