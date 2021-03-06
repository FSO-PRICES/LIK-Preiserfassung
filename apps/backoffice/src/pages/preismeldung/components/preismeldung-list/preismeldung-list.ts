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
    OnDestroy,
    Output,
    SimpleChange,
    ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { defer, Observable } from 'rxjs';

import {
    formatPercentageChange,
    PefDialogService,
    pefSearch,
    PmsFilter,
    ReactiveComponent,
    StatusFilter,
    PefVirtualScrollComponent,
} from '@lik-shared';

import {
    combineLatest,
    debounceTime,
    filter,
    flatMap,
    map,
    mapTo,
    merge,
    publishReplay,
    refCount,
    startWith,
    switchMap,
    take,
    takeUntil,
    withLatestFrom,
} from 'rxjs/operators';
import * as P from '../../../../common-models';
import { PefDialogPmStatusSelectionComponent } from '../../../../components/pef-dialog-pm-status-selection';
import { TypeaheadData } from '../pef-typeahead/pef-typeahead';

@Component({
    selector: 'preismeldung-list',
    templateUrl: 'preismeldung-list.html',
    styleUrls: ['preismeldung-list.scss'],
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
    @Output('filterChanged') public filterChanged$: Observable<Partial<PmsFilter>>;
    @Output('applyFilter') public applyFilter$: Observable<PmsFilter>;
    @Output('resetPreismeldungen') public resetPreismeldungen$ = new EventEmitter();
    @Output('selectPreismeldung') public selectPreismeldung$ = new EventEmitter<P.PreismeldungBag>();
    @Output('updateAllPmStatus') public updateAllPmStatus$: Observable<P.Models.PreismeldungStatusList>;

    @ViewChild('form', { static: true }) form: NgForm;
    @ViewChild('pmList', { static: false }) pmList: PefVirtualScrollComponent;

    public initialPmsNummer$ = this.observePropertyCurrentValue<string>('initialPmsNummer').pipe(filter(x => !!x));
    public initialFilter$: Observable<Partial<PmsFilter>> = this.observePropertyCurrentValue<PmsFilter>(
        'initialFilter',
    ).pipe(
        map(x => (this.initialPmsNummer ? { pmsNummers: [this.initialPmsNummer] } : x)),
        publishReplay(1),
        refCount(),
    );
    public preismeldungen$ = this.observePropertyCurrentValue<P.PreismeldungBag[]>('preismeldungen');
    public preiserhebers$ = this.observePropertyCurrentValue<P.Models.Erheber[]>('preiserhebers');
    public preismeldestellen$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle[]>('preismeldestellen');
    public erhebungspositions$ = this.observePropertyCurrentValue<P.Models.WarenkorbLeaf[]>('erhebungspositions');
    public currentPreismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('currentPreismeldung').pipe(
        publishReplay(1),
        refCount(),
    );

    public applyClicked$ = new EventEmitter();
    public resetFilterClicked$ = new EventEmitter();
    public updateAllPmStatusClicked$ = new EventEmitter();
    public resetFilter$: Observable<any>;
    public resetPmIdSearch$: Observable<any>;
    public scrollList: P.PreismeldungBag[];

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

    constructor(pefDialogService: PefDialogService) {
        super();

        const pmIdSearchChanged$ = this.pmIdSearchChanged$.pipe(
            publishReplay(1),
            refCount(),
        );
        const pmIdSearch$ = this.pmIdSearchApply$
            .asObservable()
            .pipe(withLatestFrom(pmIdSearchChanged$, (_, pmIdSearch) => pmIdSearch));

        this.resetFilter$ = this.resetFilterClicked$.pipe(
            merge(pmIdSearch$),
            map(() => ({})),
        );

        const confirmUpdateStatusDialog$ = defer(() =>
            pefDialogService
                .displayDialog(PefDialogPmStatusSelectionComponent, { dialogOptions: { backdropDismiss: true } })
                .pipe(
                    map(x => x.data),
                    filter(data => !!data && data.type === 'CONFIRM_SAVE'),
                ),
        );

        const statusFilter$ = this.statusFilterChanged$.asObservable().pipe(
            merge(this.resetFilter$.pipe(mapTo(''))),
            startWith(''),
            publishReplay(1),
            refCount(),
        ) as Observable<StatusFilter>;

        const currentFilter$: Observable<Partial<PmsFilter>> = this.preiserheberIdsFilter$.pipe(
            map(p => p.map(x => x.value)),
            combineLatest(
                statusFilter$,
                this.epNummersFilter$.pipe(map(e => e.map(x => x.value))),
                this.pmsNummerFilter$.pipe(map(p => p.map(x => x.value))),
                (preiserheberIds, statusFilter, epNummers, pmsNummers) => ({
                    preiserheberIds,
                    epNummers,
                    pmsNummers,
                    statusFilter,
                }),
            ),
            startWith({} as PmsFilter),
            publishReplay(1),
            refCount(),
        );

        const filter$: Observable<Partial<PmsFilter>> = pmIdSearch$.pipe(
            map(pmIdSearch => ({ pmIdSearch })),
            merge(currentFilter$),
            publishReplay(1),
            refCount(),
        );

        this.canSearch$ = filter$.pipe(
            map(
                x =>
                    (x.preiserheberIds && !!x.preiserheberIds.length) ||
                    (x.epNummers && !!x.epNummers.length) ||
                    (x.pmsNummers && !!x.pmsNummers.length) ||
                    !!x.statusFilter,
            ),
            startWith(false),
            publishReplay(1),
            refCount(),
        );

        this.triggerSubmit$.pipe(takeUntil(this.onDestroy$)).subscribe(() => this.form.ngSubmit.emit());

        this.filterChanged$ = this.applyClicked$.pipe(
            withLatestFrom(currentFilter$, (_, filter) => filter),
            merge(pmIdSearch$.pipe(map(pmIdSearch => ({ pmIdSearch })))),
            merge(this.initialPmsNummer$.pipe(map(x => ({ pmsNummers: [x] })))),
            merge(this.resetFilterClicked$.pipe(mapTo({}))),
            publishReplay(1),
            refCount(),
        );
        this.resetPmIdSearch$ = this.resetFilterClicked$.pipe(
            merge(this.applyClicked$),
            map(() => ({})),
        );

        this.filteredPreismeldungen$ = this.preismeldungen$
            // Wait for the latest value of currentPreismeldung (null | x) otherwise the ngFor renders with outdated data and does not refresh.
            .pipe(
                flatMap(x =>
                    this.currentPreismeldung$.pipe(
                        take(1),
                        mapTo(x),
                    ),
                ),
                combineLatest(this.filterTextValueChanges$.pipe(startWith(null)), (preismeldungen, filterText) => {
                    if (!filterText) {
                        return preismeldungen;
                    }
                    return pefSearch(filterText, preismeldungen, [
                        pm => pm.warenkorbPosition.gliederungspositionsnummer,
                        pm => pm.warenkorbPosition.positionsbezeichnung.de,
                        pm => pm.preismeldung.artikeltext,
                    ]);
                }),
                debounceTime(300),
                startWith([]),
                publishReplay(1),
                refCount(),
            );

        this.currentPreismeldung$
            .pipe(
                withLatestFrom(this.filteredPreismeldungen$.pipe(filter(x => x.length > 0))),
                takeUntil(this.onDestroy$),
            )
            .subscribe(([currentPm, preismeldungen]) => {
                const pm = preismeldungen.find(pm => currentPm.pmId === pm.pmId);
                this.pmList.scrollInto(pm);
            });

        this.suggestionsPreiserheberIds$ = this.preiserhebers$.pipe(
            filter(x => !!x),
            map(x =>
                x.map(p => ({
                    label: `${p.surname} ${p.firstName}`,
                    value: p._id,
                })),
            ),
            publishReplay(1),
            refCount(),
        );

        this.suggestionsPmsNummers$ = this.preismeldestellen$.pipe(
            filter(x => !!x),
            map(x =>
                x.map(pms => ({
                    label: `${pms.pmsNummer} ${pms.name}`,
                    value: pms.pmsNummer,
                })),
            ),
            publishReplay(1),
            refCount(),
        );

        this.suggestionsEpNummers$ = this.erhebungspositions$.pipe(
            filter(x => !!x),
            map(x =>
                x.map(ep => ({
                    label: `${ep.gliederungspositionsnummer} ${ep.positionsbezeichnung.de}`,
                    value: ep.gliederungspositionsnummer,
                })),
            ),
            publishReplay(1),
            refCount(),
        );

        this.updateAllPmStatus$ = this.updateAllPmStatusClicked$.pipe(
            switchMap(() => confirmUpdateStatusDialog$),
            withLatestFrom(this.filteredPreismeldungen$),
            map(([data, preismeldungen]) =>
                preismeldungen
                    .filter(bag => !!bag.preismeldung.uploadRequestedAt)
                    .map(({ pmId }) => ({ pmId, status: data.value.pmStatus })),
            ),
        );
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
