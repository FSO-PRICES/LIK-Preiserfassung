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

import { Component, EventEmitter, Input, OnChanges, Output, SimpleChange } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';

import { ReactiveComponent, Models as P, pefSearch, sortBySelector } from 'lik-shared';

@Component({
    selector: 'preiserheber-list',
    templateUrl: 'preiserheber-list.html',
})
export class PreiserheberListComponent extends ReactiveComponent implements OnChanges {
    @Input() list: P.Erheber[];
    @Input() current: P.Erheber;
    @Output('selected') public selectPreiserheber$ = new EventEmitter<P.Erheber>();

    public preiserhebers$: Observable<P.Erheber[]>;
    public current$: Observable<P.Erheber>;

    public filterTextValueChanges = new EventEmitter<string>();

    public filteredPreiserhebers$: Observable<P.Erheber[]>;
    public viewPortItems: P.Erheber[];

    constructor(private formBuilder: FormBuilder) {
        super();

        this.preiserhebers$ = this.observePropertyCurrentValue<P.Erheber[]>('list')
            .publishReplay(1)
            .refCount();
        this.filteredPreiserhebers$ = this.preiserhebers$.combineLatest(
            this.filterTextValueChanges.startWith(null),
            (preiserhebers, filterText) =>
                sortBySelector(
                    !filterText
                        ? preiserhebers
                        : pefSearch(filterText, preiserhebers, [
                              x => x.firstName,
                              x => x.surname,
                              x => x.erhebungsregion,
                          ]),
                    pe => pe.surname
                )
        );

        this.current$ = this.observePropertyCurrentValue<P.Erheber>('current');
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
