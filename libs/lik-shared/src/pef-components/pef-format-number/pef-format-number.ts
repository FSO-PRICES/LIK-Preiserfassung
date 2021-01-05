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

import { Directive, ElementRef, HostListener, Input, OnInit } from '@angular/core';
import * as format from 'format-number';
import { isObject, isString } from 'lodash';

@Directive({
    selector: '[pef-format-number]',
})
export class PefFormatNumber implements OnInit {
    @Input('pef-format-number') formatOptions: string | Object;

    constructor(private elementRef: ElementRef) {}

    ngOnInit() {
        setTimeout(() => this.formatElValue());
    }

    @HostListener('focus')
    onFocus() {
        // would unformat here, right now not implemented because formatting with a comma separator causes
        // <input type='number'> to barf, so right now all numbers are unformatted (without commas) all the time
    }

    @HostListener('blur')
    onBlur() {
        this.formatElValue();
    }

    @HostListener('ngModelChange', ['$event'])
    onChange() {
        const el = this.getInputElement();
        if (el !== document.activeElement) setTimeout(() => this.formatElValue());
    }

    getInputElement() {
        return this.elementRef.nativeElement.getElementsByTagName('input')[0];
    }

    formatElValue() {
        const el = this.getInputElement();
        el.value = format(this._formatOptions)(el.valueAsNumber);
    }

    get _formatOptions(): Object {
        if (isString(this.formatOptions)) return JSON.parse(this.formatOptions as string);
        if (isObject(this.formatOptions)) return this.formatOptions;
        return undefined;
    }
}
