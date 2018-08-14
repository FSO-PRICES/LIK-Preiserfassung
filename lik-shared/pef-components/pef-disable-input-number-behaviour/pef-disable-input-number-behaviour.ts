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

import { Directive, HostListener, Renderer, ElementRef } from '@angular/core';

@Directive({
    selector: '[pef-disable-input-number-behaviour]',
})
export class PefDisableInputNumberBehaviourDirective {
    private mousewheelDisableScrollListener: Function = null;
    private keydownListener: Function = null;

    constructor(private elementRef: ElementRef, private renderer: Renderer) {
    }

    @HostListener('focus')
    onFocus() {
        const inputElement = this.elementRef.nativeElement.getElementsByTagName('input')[0] as HTMLInputElement;
        this.mousewheelDisableScrollListener = this.renderer.listen(inputElement, 'mousewheel', (e: Event) => {
            e.preventDefault();
        });
        this.keydownListener = this.renderer.listen(inputElement, 'keydown', (e: KeyboardEvent) => {
            if (e.which === 38 || e.which === 40) {
                e.preventDefault();
            }
        });
    }

    @HostListener('blur')
    onBlur() {
        if (!!this.mousewheelDisableScrollListener) {
            this.mousewheelDisableScrollListener();
            this.mousewheelDisableScrollListener = null;
        }
        if (!!this.keydownListener) {
            this.keydownListener();
            this.keydownListener = null;
        }
    }
}
