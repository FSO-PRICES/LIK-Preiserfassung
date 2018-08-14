/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

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
