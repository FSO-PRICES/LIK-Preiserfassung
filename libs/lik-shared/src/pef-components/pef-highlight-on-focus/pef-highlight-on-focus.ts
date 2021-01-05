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

import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
    selector: '[pef-highlight-on-focus]',
})
export class PefHighlightOnFocus {
    constructor(private elementRef: ElementRef) {}

    @HostListener('focus')
    onFocus() {
        const inputElement = this.elementRef.nativeElement.getElementsByTagName('input')[0] as HTMLInputElement;
        if (!inputElement) return;
        inputElement.select();
    }
}
