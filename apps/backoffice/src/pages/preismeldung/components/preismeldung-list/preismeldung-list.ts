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
import { Observable } from 'rxjs';

import { formatPercentageChange, pefSearch, PmsFilter, ReactiveComponent, StatusFilter } from '@lik-shared';

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
    take,
    takeUntil,
    tap,
    withLatestFrom,
} from 'rxjs/operators';
import * as P from '../../../../common-models';
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

    @ViewChild('form', { static: true }) form: NgForm;

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

    constructor() {
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
                tap(x => console.log('pm filtered:', x.map(y => y.preismeldung.epNummer), x.length, x)),
                startWith([]),
                publishReplay(1),
                refCount(),
            );

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
