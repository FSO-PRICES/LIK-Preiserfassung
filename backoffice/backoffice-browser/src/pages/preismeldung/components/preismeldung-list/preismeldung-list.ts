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
    Component,
    EventEmitter,
    Output,
    SimpleChange,
    Input,
    OnChanges,
    OnDestroy,
    ChangeDetectionStrategy,
    ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';

import { first } from 'lodash';

import { ReactiveComponent, pefSearch, PmsFilter, formatPercentageChange } from 'lik-shared';

import * as P from '../../../../common-models';
import { TypeaheadData } from '../pef-typeahead/pef-typeahead';

@Component({
    selector: 'preismeldung-list',
    templateUrl: 'preismeldung-list.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldungListComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() preismeldungen: P.PreismeldungBag[];
    @Input() preiserhebers: P.Models.Erheber[];
    @Input() preismeldestellen: P.Models.Preismeldestelle[];
    @Input() preismeldungenStatus: { [pmId: string]: P.Models.PreismeldungStatus };
    @Input() erhebungspositions: any[];
    @Input() currentPreismeldung: P.PreismeldungBag;
    @Input() initialPmsNummer: string;
    @Input() initialFilter: PmsFilter;
    @Output('filterChanged') public filterChanged$: Observable<PmsFilter>;
    @Output('applyFilter') public applyFilter$: Observable<PmsFilter>;
    @Output('resetPreismeldungen') public resetPreismeldungen$ = new EventEmitter();
    @Output('selectPreismeldung') public selectPreismeldung$ = new EventEmitter<P.PreismeldungBag>();

    @ViewChild('form') form: NgForm;

    public initialPmsNummer$ = this.observePropertyCurrentValue<string>('initialPmsNummer').filter(x => !!x);
    public initialFilter$: Observable<{ [p in keyof PmsFilter]: string[] }> = this.observePropertyCurrentValue<
        PmsFilter
    >('initialFilter')
        .map(x => (this.initialPmsNummer ? { pmsNummers: [this.initialPmsNummer] } : x))
        .publishReplay(1)
        .refCount();
    public preismeldungen$ = this.observePropertyCurrentValue<P.PreismeldungBag[]>('preismeldungen');
    public preiserhebers$ = this.observePropertyCurrentValue<P.Models.Erheber[]>('preiserhebers');
    public preismeldestellen$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle[]>('preismeldestellen');
    public erhebungspositions$ = this.observePropertyCurrentValue<P.Models.WarenkorbLeaf[]>('erhebungspositions');
    public currentPreismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('currentPreismeldung')
        .publishReplay(1)
        .refCount();

    public applyClicked$ = new EventEmitter();
    public resetFilterClicked$ = new EventEmitter();
    public resetFilter$: Observable<any>;
    public resetPmIdSearch$: Observable<any>;

    public pmIdSearchChanged$ = new EventEmitter<string>();
    public pmIdSearchApply$ = new EventEmitter<string>();
    public filterTextValueChanges$ = new EventEmitter<string>();
    public preiserheberIdsFilter$ = new EventEmitter<TypeaheadData[]>();
    public pmsNummerFilter$ = new EventEmitter<TypeaheadData[]>();
    public epNummersFilter$ = new EventEmitter<TypeaheadData[]>();
    public statusFilterChanged$ = new EventEmitter<string>();
    public triggerSubmit$ = new EventEmitter();

    public filteredPreismeldungen$: Observable<P.PreismeldungBag[]>;
    public viewPortItems: P.PreismeldungBag[];
    public canSearch$: Observable<boolean>;
    public suggestionsEpNummers$: Observable<TypeaheadData[]>;
    public suggestionsPmsNummers$: Observable<TypeaheadData[]>;
    public suggestionsPreiserheberIds$: Observable<TypeaheadData[]>;

    private onDestroy$ = new EventEmitter();

    constructor() {
        super();

        const pmIdSearchChanged$ = this.pmIdSearchChanged$.publishReplay(1).refCount();
        const pmIdSearch$ = this.pmIdSearchApply$
            .asObservable()
            .withLatestFrom(pmIdSearchChanged$, (_, pmIdSearch) => pmIdSearch);

        this.resetFilter$ = this.resetFilterClicked$.merge(pmIdSearch$).map(() => ({}));

        const statusFilter$ = this.statusFilterChanged$
            .asObservable()
            .merge(this.resetFilter$.mapTo(''))
            .startWith('')
            .publishReplay(1)
            .refCount();

        const currentFilter$: Observable<PmsFilter> = this.preiserheberIdsFilter$
            .map(p => p.map(x => x.value))
            .combineLatest(
                statusFilter$,
                this.epNummersFilter$.map(e => e.map(x => x.value)),
                this.pmsNummerFilter$.map(p => p.map(x => x.value)),
                (preiserheberIds, statusFilter, epNummers, pmsNummers) => ({
                    preiserheberIds,
                    epNummers,
                    pmsNummers,
                    statusFilter,
                })
            )
            .startWith({})
            .publishReplay(1)
            .refCount();

        const filter$: Observable<Partial<PmsFilter>> = pmIdSearch$
            .map(pmIdSearch => ({ pmIdSearch }))
            .merge(currentFilter$)
            .publishReplay(1)
            .refCount();

        this.canSearch$ = filter$
            .map(
                x =>
                    (x.preiserheberIds && !!x.preiserheberIds.length) ||
                    (x.epNummers && !!x.epNummers.length) ||
                    (x.pmsNummers && !!x.pmsNummers.length) ||
                    !!x.statusFilter
            )
            .startWith(false)
            .publishReplay(1)
            .refCount();

        this.triggerSubmit$.takeUntil(this.onDestroy$).subscribe(() => this.form.ngSubmit.emit());

        this.filterChanged$ = this.applyClicked$
            .withLatestFrom(currentFilter$, (_, filter) => filter)
            .merge(pmIdSearch$.map(pmIdSearch => ({ pmIdSearch })))
            .merge(this.initialPmsNummer$.map(x => ({ pmsNummers: [x] })))
            .publishReplay(1)
            .refCount();
        this.resetPmIdSearch$ = this.resetFilterClicked$.merge(this.applyClicked$).map(() => ({}));

        this.filteredPreismeldungen$ = this.preismeldungen$
            // Wait for the latest value of currentPreismeldung (null | x) otherwise the ngFor renders with outdated data and does not refresh.
            .flatMap(x => this.currentPreismeldung$.take(1).mapTo(x))
            .combineLatest(this.filterTextValueChanges$.startWith(null), (preismeldungen, filterText) => {
                if (!filterText) {
                    return preismeldungen;
                }
                return pefSearch(filterText, preismeldungen, [
                    pm => pm.warenkorbPosition.gliederungspositionsnummer,
                    pm => pm.warenkorbPosition.positionsbezeichnung.de,
                    pm => pm.preismeldung.artikeltext,
                ]);
            })
            .debounceTime(300)
            .startWith([]);

        this.suggestionsPreiserheberIds$ = this.preiserhebers$
            .filter(x => !!x)
            .map(x =>
                x.map(p => ({
                    label: `${p.surname} ${p.firstName}`,
                    value: p._id,
                }))
            )
            .publishReplay(1)
            .refCount();

        this.suggestionsPmsNummers$ = this.preismeldestellen$
            .filter(x => !!x)
            .map(x =>
                x.map(pms => ({
                    label: `${pms.pmsNummer} ${pms.name}`,
                    value: pms.pmsNummer,
                }))
            )
            .publishReplay(1)
            .refCount();

        this.suggestionsEpNummers$ = this.erhebungspositions$
            .filter(x => !!x)
            .map(x =>
                x.map(ep => ({
                    label: `${ep.gliederungspositionsnummer} ${ep.positionsbezeichnung.de}`,
                    value: ep.gliederungspositionsnummer,
                }))
            )
            .publishReplay(1)
            .refCount();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    public ngOnDestroy() {
        this.onDestroy$.next();
    }

    formatPercentageChange = (preismeldung: P.Models.Preismeldung) => {
        return preismeldung.d_DPToVPK != null &&
            preismeldung.d_DPToVPK.percentage != null &&
            !isNaN(preismeldung.d_DPToVPK.percentage)
            ? formatPercentageChange(preismeldung.d_DPToVPK.percentage, 1)
            : formatPercentageChange(preismeldung.d_DPToVP.percentage, 1);
    };

    getBearbeitungscodeDescription(bearbeitungscode: P.Models.Bearbeitungscode) {
        return P.Models.bearbeitungscodeDescriptions[bearbeitungscode];
    }
}
