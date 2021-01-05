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

import { Directive, EventEmitter, Inject, OnDestroy, Output } from '@angular/core';
import { WINDOW } from 'ngx-window-token';

@Directive({
    selector: '[pefOnClickOutside]',
})
export class PefOnClickOutside implements OnDestroy {
    @Output('pefOnClickOutside') clickedOutside$ = new EventEmitter<MouseEvent>();

    constructor(@Inject(WINDOW) private wndw: Window) {
        wndw.document.addEventListener('click', this.addClickListener());
    }

    ngOnDestroy() {
        this.wndw.document.removeEventListener('click', this.addClickListener());
    }

    addClickListener() {
        return (e: MouseEvent) => {
            this.clickedOutside$.emit(e);
        };
    }
}
