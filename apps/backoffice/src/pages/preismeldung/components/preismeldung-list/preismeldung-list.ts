import { CdkScrollable } from '@angular/cdk/scrolling';
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
import { Observable, Subject, defer } from 'rxjs';
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
    shareReplay,
    startWith,
    switchMap,
    take,
    takeUntil,
    withLatestFrom,
} from 'rxjs/operators';

import {
    PefDialogService,
    PmsFilter,
    ReactiveComponent,
    StatusFilter,
    formatPercentageChange,
    pefSearch,
} from '@lik-shared';

import * as P from '../../../../common-models';
import {
    DialogPmStatusSelectionResult,
    PefDialogPmStatusSelectionComponent,
} from '../../../../components/pef-dialog-pm-status-selection';
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
    @Input() hasWritePermission: boolean;

    @Output('filterChanged') public filterChanged$: Observable<Partial<PmsFilter>>;
    @Output('applyFilter') public applyFilter$: Observable<PmsFilter>;
    @Output('resetPreismeldungen') public resetPreismeldungen$ = new EventEmitter();
    @Output('selectPreismeldung') public selectPreismeldung$ = new EventEmitter<P.PreismeldungBag>();
    @Output('updateAllPmStatus') public updateAllPmStatus$: Observable<P.Models.PreismeldungStatusList>;

    @ViewChild('form', { static: true }) form: NgForm;
    @ViewChild(CdkScrollable) cdkScrollable: CdkScrollable;

    public initialPmsNummer$ = this.observePropertyCurrentValue<string>('initialPmsNummer').pipe(filter((x) => !!x));
    public initialFilter$: Observable<Partial<PmsFilter>> = this.observePropertyCurrentValue<PmsFilter>(
        'initialFilter',
    ).pipe(
        map((x) => (this.initialPmsNummer ? { pmsNummers: [this.initialPmsNummer] } : x)),
        shareReplay({ bufferSize: 1, refCount: true }),
    );
    public preismeldungen$ = this.observePropertyCurrentValue<P.PreismeldungBag[]>('preismeldungen');
    public preiserhebers$ = this.observePropertyCurrentValue<P.Models.Erheber[]>('preiserhebers');
    public preismeldestellen$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle[]>('preismeldestellen');
    public erhebungspositions$ = this.observePropertyCurrentValue<P.Models.WarenkorbLeaf[]>('erhebungspositions');
    public currentPreismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('currentPreismeldung').pipe(
        shareReplay({ bufferSize: 1, refCount: true }),
    );
    public hasWritePermission$ = this.observePropertyCurrentValue<boolean>('hasWritePermission').pipe(
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    public applyClicked$ = new EventEmitter();
    public resetFilterClicked$ = new EventEmitter();
    public updateAllPmStatusClicked$ = new EventEmitter();
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

    public preismeldungItemHeight = 60;

    private onDestroy$ = new Subject<void>();

    constructor(pefDialogService: PefDialogService) {
        super();

        const pmIdSearchChanged$ = this.pmIdSearchChanged$.pipe(publishReplay(1), refCount());
        const pmIdSearch$ = this.pmIdSearchApply$
            .asObservable()
            .pipe(withLatestFrom(pmIdSearchChanged$, (_, pmIdSearch) => pmIdSearch));

        this.resetFilter$ = this.resetFilterClicked$.pipe(
            merge(pmIdSearch$),
            map(() => ({})),
        );

        const confirmUpdateStatusDialog$ = defer(() =>
            pefDialogService
                .displayDialog(PefDialogPmStatusSelectionComponent, { disableClose: true, data: { hasMarker: false } })
                .pipe(filter(DialogPmStatusSelectionResult.is.CONFIRM_SAVE)),
        );

        const statusFilter$ = this.statusFilterChanged$
            .asObservable()
            .pipe(
                merge(this.resetFilter$.pipe(mapTo(''))),
                startWith(''),
                shareReplay({ bufferSize: 1, refCount: true }),
            ) as Observable<StatusFilter>;

        const currentFilter$: Observable<Partial<PmsFilter>> = this.preiserheberIdsFilter$.pipe(
            map((p) => p.map((x) => x.value)),
            combineLatest(
                statusFilter$,
                this.epNummersFilter$.pipe(map((e) => e.map((x) => x.value))),
                this.pmsNummerFilter$.pipe(map((p) => p.map((x) => x.value))),
                (preiserheberIds, statusFilter, epNummers, pmsNummers) => ({
                    preiserheberIds,
                    epNummers,
                    pmsNummers,
                    statusFilter,
                }),
            ),
            startWith({} as PmsFilter),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        const filter$: Observable<Partial<PmsFilter>> = pmIdSearch$.pipe(
            map((pmIdSearch) => ({ pmIdSearch })),
            merge(currentFilter$),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        this.canSearch$ = filter$.pipe(
            map(
                (x) =>
                    (x.preiserheberIds && !!x.preiserheberIds.length) ||
                    (x.epNummers && !!x.epNummers.length) ||
                    (x.pmsNummers && !!x.pmsNummers.length) ||
                    !!x.statusFilter,
            ),
            startWith(false),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        this.triggerSubmit$.pipe(takeUntil(this.onDestroy$)).subscribe(() => this.form.ngSubmit.emit());

        this.filterChanged$ = this.applyClicked$.pipe(
            withLatestFrom(currentFilter$, (_, filter) => filter),
            merge(pmIdSearch$.pipe(map((pmIdSearch) => ({ pmIdSearch })))),
            merge(this.initialPmsNummer$.pipe(map((x) => ({ pmsNummers: [x] })))),
            merge(this.resetFilterClicked$.pipe(mapTo({}))),
            shareReplay({ bufferSize: 1, refCount: true }),
        );
        this.resetPmIdSearch$ = this.resetFilterClicked$.pipe(
            merge(this.applyClicked$),
            map(() => ({})),
        );

        this.filteredPreismeldungen$ = this.preismeldungen$
            // Wait for the latest value of currentPreismeldung (null | x) otherwise the ngFor renders with outdated data and does not refresh.
            .pipe(
                flatMap((x) => this.currentPreismeldung$.pipe(take(1), mapTo(x))),
                combineLatest(this.filterTextValueChanges$.pipe(startWith(null)), (preismeldungen, filterText) => {
                    if (!filterText) {
                        return preismeldungen;
                    }
                    return pefSearch(filterText, preismeldungen, [
                        (pm) => pm.warenkorbPosition.gliederungspositionsnummer,
                        (pm) => pm.warenkorbPosition.positionsbezeichnung.de,
                        (pm) => pm.preismeldung.artikeltext,
                    ]);
                }),
                debounceTime(300),
                startWith([]),
                shareReplay({ bufferSize: 1, refCount: true }),
            );

        this.currentPreismeldung$
            .pipe(
                withLatestFrom(this.filteredPreismeldungen$.pipe(filter((x) => x.length > 0))),
                takeUntil(this.onDestroy$),
            )
            .subscribe(([currentPm, preismeldungen]) => {
                const pm = preismeldungen.find((pm) => currentPm.pmId === pm.pmId);
                const index = preismeldungen.indexOf(pm);
                if (index < 0) return;

                const scrollListHeight = this.cdkScrollable
                    .getElementRef()
                    .nativeElement.getBoundingClientRect().height;

                const clickedItemOffset = index * this.preismeldungItemHeight;
                const scrollOffset = this.cdkScrollable.measureScrollOffset('top');

                if (clickedItemOffset < scrollOffset) {
                    this.cdkScrollable.scrollTo({
                        top: clickedItemOffset,
                        behavior: 'smooth',
                    });
                }
                if (clickedItemOffset + this.preismeldungItemHeight > scrollOffset + scrollListHeight) {
                    this.cdkScrollable.scrollTo({
                        top: clickedItemOffset - scrollListHeight + this.preismeldungItemHeight,
                        behavior: 'smooth',
                    });
                }
            });

        this.suggestionsPreiserheberIds$ = this.preiserhebers$.pipe(
            filter((x) => !!x),
            map((x) =>
                x.map((p) => ({
                    label: `${p.surname} ${p.firstName}`,
                    value: p._id,
                })),
            ),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        this.suggestionsPmsNummers$ = this.preismeldestellen$.pipe(
            filter((x) => !!x),
            map((x) =>
                x.map((pms) => ({
                    label: `${pms.pmsNummer} ${pms.name}`,
                    value: pms.pmsNummer,
                })),
            ),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        this.suggestionsEpNummers$ = this.erhebungspositions$.pipe(
            filter((x) => !!x),
            map((x) =>
                x.map((ep) => ({
                    label: `${ep.gliederungspositionsnummer} ${ep.positionsbezeichnung.de}`,
                    value: ep.gliederungspositionsnummer,
                })),
            ),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        this.updateAllPmStatus$ = this.updateAllPmStatusClicked$.pipe(
            switchMap(() => confirmUpdateStatusDialog$),
            withLatestFrom(this.filteredPreismeldungen$),
            map(([data, preismeldungen]) => {
                return preismeldungen
                    .filter((bag) => !!bag.preismeldung.uploadRequestedAt)
                    .filter(
                        (bag) =>
                            this.preismeldungenStatus[bag.preismeldung._id] ||
                            this.preismeldungenStatus[bag.preismeldung._id] === 0,
                    )
                    .map(({ pmId }) => ({ pmId, status: data.pmStatus }));
            }),
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
