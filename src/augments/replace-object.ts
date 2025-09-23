import {type AnyObject} from '@augment-vir/common';

export function replaceObject<T extends AnyObject>(original: T, replacement: T): void {
    Object.keys(original).forEach((key) => delete original[key]);
    Object.entries(replacement).forEach(
        ([
            key,
            value,
        ]) => {
            (original as AnyObject)[key] = value;
        },
    );
}
