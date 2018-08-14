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

import { Component, Output, Input, OnChanges, OnDestroy, SimpleChange, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ReactiveComponent } from '../../';

@Component({
    selector: 'pef-search-input',
    template: `
        <ion-item class="pef-label" *ngIf="!!label">
            <ion-label>{{label}}</ion-label>
        </ion-item>
        <ion-item class="pef-search">
            <ion-label>
                <pef-icon name="search"></pef-icon>
            </ion-label>
            <ion-input type="text" clearInput [formControl]="filterText"></ion-input>
        </ion-item>`,
})
export class PefSearchInput extends ReactiveComponent implements OnChanges, OnDestroy {
    public filterText = new FormControl();
    @Input() reset: any;
    @Input() label: string;
    @Input() value: string;
    @Output() valueChanges = this.filterText.valueChanges;

    private onDestroy$ = new EventEmitter();

    constructor() {
        super();
        this.observePropertyCurrentValue<any>('reset')
            .mapTo(null)
            .merge(this.observePropertyCurrentValue<string>('value'))
            .takeUntil(this.onDestroy$)
            .subscribe(value => {
                this.filterText.patchValue(value);
            });
    }

    public ngOnDestroy() {
        this.onDestroy$.next();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
