import { AbstractControl } from '@angular/forms';
import format, { IFormatNumberOptions } from 'format-number';

export interface ValidationResult {
    [key: string]: any;
}

export function maxMinNumberValidatorFactory(
    minNumber: number,
    maxNumber: number,
    formatNumberOptions?: IFormatNumberOptions,
) {
    return (control: AbstractControl): ValidationResult => {
        if (control.value == null) return {};

        const valueAsNumber = parseFloat(control.value);
        if (isNaN(valueAsNumber) || valueAsNumber < minNumber || valueAsNumber > maxNumber) {
            return {
                'number-out-of-range': {
                    minNumber: formatNumberOptions ? format(formatNumberOptions)(minNumber) : minNumber,
                    maxNumber: formatNumberOptions ? format(formatNumberOptions)(maxNumber) : maxNumber,
                },
            };
        }

        return {};
    };
}
