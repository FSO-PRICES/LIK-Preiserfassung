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

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { Models as P } from 'lik-shared';

@Component({
    selector: 'pef-pm-status',
    templateUrl: 'pef-pm-status.component.html',
})
export class PefPmStatusComponent {
    @Input() disabled: boolean;
    @Input() preismeldungStatus: P.PreismeldungStatus;
    @Output('setPreismeldungStatus') setPreismeldungStatus$: Observable<P.PreismeldungStatus>;

    public inputChanged$ = new EventEmitter<string>();

    constructor() {
        this.setPreismeldungStatus$ = this.inputChanged$.asObservable().map(x => +x);
    }
}
