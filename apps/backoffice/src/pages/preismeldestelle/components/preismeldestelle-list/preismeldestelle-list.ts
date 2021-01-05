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

import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChange,
} from '@angular/core';
import { Observable } from 'rxjs';
import { combineLatest, publishReplay, refCount, startWith } from 'rxjs/operators';

import { Models as P, pefSearch, ReactiveComponent, sortBySelector } from '@lik-shared';

@Component({
    selector: 'preismeldestelle-list',
    templateUrl: 'preismeldestelle-list.html',
    styleUrls: ['preismeldestelle-list.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldestelleListComponent extends ReactiveComponent implements OnChanges {
    @Input() list: P.Preismeldestelle[];
    @Input() current: P.Preismeldestelle;
    @Output('selected') public selectPreismeldestelle$ = new EventEmitter<P.Preismeldestelle>();

    public preismeldestellen$: Observable<P.Preismeldestelle[]>;
    public current$: Observable<P.Preismeldestelle>;

    public filterTextValueChanges = new EventEmitter<string>();

    public filteredPreismeldestellen$: Observable<P.Preismeldestelle[]>;
    public viewPortItems: P.Preismeldestelle[];

    constructor() {
        super();

        this.preismeldestellen$ = this.observePropertyCurrentValue<P.Preismeldestelle[]>('list').pipe(
            publishReplay(1),
            refCount(),
        );
        this.filteredPreismeldestellen$ = this.preismeldestellen$.pipe(
            combineLatest(this.filterTextValueChanges.pipe(startWith(null)), (preismeldestellen, filterText) =>
                sortBySelector(
                    !filterText
                        ? preismeldestellen
                        : pefSearch(filterText, preismeldestellen, [
                              x => x.name,
                              x => x.pmsNummer,
                              x => x.town,
                              x => x.postcode,
                              x => x.erhebungsregion,
                          ]),
                    pms => pms.name,
                ),
            ),
            publishReplay(1),
            refCount(),
        );

        this.current$ = this.observePropertyCurrentValue<P.Preismeldestelle>('current');
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
