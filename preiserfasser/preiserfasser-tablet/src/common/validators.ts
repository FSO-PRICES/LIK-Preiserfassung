import { AbstractControl } from '@angular/forms';
import * as format from 'format-number';

export interface ValidationResult {
    [key: string]: any;
}

export function maxMinNumberValidatorFactory(minNumber: number, maxNumber: number, formatNumberOptions?: Object) {
    return (control: AbstractControl): ValidationResult => {
        if (control.value == null) return null;

        const valueAsNumber = parseFloat(control.value);
        if (isNaN(valueAsNumber) || valueAsNumber < minNumber || valueAsNumber > maxNumber) {
            return {
                'number-out-of-range': {
                    minNumber: !!formatNumberOptions ? format(formatNumberOptions)(minNumber) : minNumber,
                    maxNumber: !!formatNumberOptions ? format(formatNumberOptions)(maxNumber) : maxNumber
                }
            };
        }

        return null;
    };
}
