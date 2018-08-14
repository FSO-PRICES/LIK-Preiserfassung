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

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
    selector: 'pef-zoom',
    templateUrl: 'pef-zoom.component.html',
})
export class PefZoomComponent {
    @Input('min') min = 0.5;
    @Input('max') max = 1;
    @Output('zoomLevel') zoomLevel$: Observable<number>;

    public setZoom$ = new EventEmitter<number>();

    constructor() {
        this.zoomLevel$ = this.setZoom$
            .scan((acc, value, i) => +(acc + value).toPrecision(1), 1)
            .startWith(1)
            .publishReplay(1)
            .refCount();
    }
}
