import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChange } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { first } from 'lodash';
import { defer, merge, Observable, Subject } from 'rxjs';
import {
    combineLatest,
    distinctUntilChanged,
    filter,
    map,
    mapTo,
    merge as mergeO,
    publishReplay,
    refCount,
    scan,
    shareReplay,
    startWith,
    switchMap,
    takeUntil,
    withLatestFrom,
} from 'rxjs/operators';

import { PefDialogService, ReactiveComponent } from '@lik-shared';

import { CONTROLLING_0830, CONTROLLING_TYPE, ControllingTypesWithoutPmStatus } from '../../../actions/controlling';
import * as P from '../../../common-models';
import { PefDialogPmStatusSelectionComponent } from '../../../components/pef-dialog-pm-status-selection';
import { ColumnValue, ShortColumnNames } from '../../../reducers/controlling';

@Component({
    selector: 'controlling-report',
    templateUrl: 'controlling-report.html',
    styleUrls: ['controlling-report.scss'],
})
export class ControllingReportComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() reportData: P.ControllingReportData;
    @Input() preismeldungenStatus: { [pmId: string]: P.Models.PreismeldungStatus };
    @Output('setPreismeldungStatus')
    setPreismeldungStatus$ = new EventEmitter<{ pmId: string; status: P.Models.PreismeldungStatus }>();
    @Output('runReport') runReport$ = new EventEmitter<string>();
    @Output('editPreismeldungId') editPreismeldungId$ = new EventEmitter<string>();
    @Output('updateAllPmStatus') public updateAllPmStatus$: Observable<P.Models.PreismeldungStatusList>;

    public updateAllPmStatusClicked$ = new EventEmitter();
    public sameLineClicked$ = new EventEmitter();
    public marked$ = new EventEmitter<number>();
    public setPreismeldungStatusFilter$ = new EventEmitter<number>();
    public controllingTypeSelected$ = new EventEmitter<CONTROLLING_TYPE>();
    public zoomLevel$ = new EventEmitter<number>();
    public toggleColumn$ = new EventEmitter<number>();
    public hiddenColumns$: Observable<boolean[]>;
    public hasStatusInputDisabled$: Observable<boolean>;
    public controllingType$: Observable<string>;
    public shortColumnNames = ShortColumnNames;

    private onDestroy$ = new EventEmitter();
    private cleanupMarked$ = new Subject();

    public controllings = [
        { name: 'CONTROLLING_0100', label: '0100: Heizöl, Treibstoffe (Stichtag 1): Vollständigkeit' },
        { name: 'CONTROLLING_0110', label: '0110: Heizöl (Stichtag 1): Preistrend' },
        { name: 'CONTROLLING_0115', label: '0115: Treibstoffe (Stichtag 1): Preistrend' },
        { name: 'CONTROLLING_0120', label: '0120: Heizöl, Treibstoffe (Stichtag 1): Niveauvergleich nach EP' },
        { name: 'CONTROLLING_0200', label: '0200: Heizöl, Treibstoffe (Stichtag 2): Vollständigkeit' },
        { name: 'CONTROLLING_0210', label: '0210: Heizöl (Stichtag 2): Preistrend' },
        { name: 'CONTROLLING_0215', label: '0215: Treibstoffe (Stichtag 2): Preistrend' },
        { name: 'CONTROLLING_0220', label: '0220: Heizöl, Treibstoffe (Stichtag 2): Niveauvergleich nach EP' },
        { name: 'CONTROLLING_0230', label: '0230: Früchte, Gemüse (Woche 1): Vollständigkeit' },
        { name: 'CONTROLLING_0240', label: '0240: Früchte, Gemüse (Woche 2): Vollständigkeit' },
        { name: 'CONTROLLING_0250', label: '0250: Früchte, Gemüse: Codefehler (0, R, S)' },
        { name: 'CONTROLLING_0300', label: '0300: Bekleidung, Schuhe: Codefehler (7, R, S)' },
        { name: 'CONTROLLING_0310', label: '0310: Bekleidung: gelöschte Preise (Code 0)' },
        { name: 'CONTROLLING_0320', label: '0320: Bekleidung, Schuhe: Ersatz im Ausverkauf (Code 1+A)' },
        { name: 'CONTROLLING_0400', label: '0400: Gelöschte Preise (Code 0, ohne Bekleidung, Früchte, Gemüse)' },
        {
            name: 'CONTROLLING_0405',
            label: '0405: Fehlende Preise (Code R/S, ohne Bekleidung, Schuhe, Früchte, Gemüse)',
        },
        {
            name: 'CONTROLLING_0410',
            label: '0410: Direktersatz mit Aktion (Code 1+A, ohne Bekleidung, Schuhe, Früchte, Gemüse)',
        },
        { name: 'CONTROLLING_0420', label: '0420: Qualität Ersterfassung: Ersatz (Code 1, 7)' },
        { name: 'CONTROLLING_0430', label: '0430: Direktersatz Prüfung: Neue Artikel (Code 1 statt 0, 2, 3 möglich?)' },
        { name: 'CONTROLLING_0440', label: '0440: Qualität Ersterfassung: Neue Artikel (Code 2, 3)' },
        { name: 'CONTROLLING_0450', label: '0450: Geänderter Artikeltext ohne Ersatzcode' },
        { name: 'CONTROLLING_0500', label: '0500: Ausreisser (-75%/+250%)' },
        { name: 'CONTROLLING_0510', label: '0510: Preisentwicklung auffällig: Normalpreise' },
        { name: 'CONTROLLING_0520', label: '0520: Preisentwicklung auffällig: Ersatz (Code 1, 7)' },
        { name: 'CONTROLLING_0530', label: '0530: Preisentwicklung auffällig: extreme Aktionen' },
        { name: 'CONTROLLING_0540', label: '0540: Preisentwicklung auffällig: steigende Aktionspreise' },
        // { name: 'CONTROLLING_0550', label: '0550: PMS mit unveränderten Preisen' }, // TODO: Not possible at the moment
        { name: 'CONTROLLING_0600', label: '0600: Bemerkungen ans BFS' },
        { name: 'CONTROLLING_0700', label: '0700: Preise/EP: Abweichung von Vorgabe (gemäss ES)' },
        { name: 'CONTROLLING_0810', label: '0810: Ungeprüfte Preismeldungen' },
        { name: 'CONTROLLING_0820', label: '0820: Blockierte Preismeldungen' },
        { name: 'CONTROLLING_0830', label: '0830: Geprüfte Preismeldungen für Export' },
    ];

    public reportData$ = this.observePropertyCurrentValue<P.ControllingReportData>('reportData').pipe(
        distinctUntilChanged(),
        publishReplay(1),
        refCount(),
    );
    public preismeldungenStatus$ = this.observePropertyCurrentValue<{ [pmId: string]: P.Models.PreismeldungStatus }>(
        'preismeldungenStatus',
    ).pipe(
        distinctUntilChanged(),
        publishReplay(1),
        refCount(),
    );
    public preismeldungStatusFilter$ = this.setPreismeldungStatusFilter$.asObservable().pipe(
        startWith(P.Models.PreismeldungStatusFilter.exportiert),
        distinctUntilChanged(),
        publishReplay(1),
        refCount(),
    );
    public currentlyMarked$: Observable<number> = merge(this.marked$, this.cleanupMarked$.pipe(mapTo(null))).pipe(
        startWith(null),
        scan((prev, curr) => (prev === curr ? null : curr), null),
        distinctUntilChanged(),
        publishReplay(1),
        refCount(),
    );

    public sameLine$ = this.sameLineClicked$.pipe(
        scan(prev => !prev, false),
        startWith(false),
    );

    public preismeldungen$ = this.reportData$.pipe(
        combineLatest(this.preismeldungStatusFilter$, this.preismeldungenStatus$, this.currentlyMarked$),
        filter(([x]) => !!x && !!x.rows),
        map(([x, statusFilter, preismeldungenStatus, marked]) =>
            x.rows
                .filter(r => {
                    if (ControllingTypesWithoutPmStatus.some(t => t === x.controllingType)) {
                        return !r.exported;
                    }
                    if (x.controllingType === CONTROLLING_0830) {
                        return (
                            !r.exported &&
                            preismeldungenStatus[r.pmId] != null &&
                            preismeldungenStatus[r.pmId] <= statusFilter
                        );
                    }
                    if (statusFilter === P.Models.PreismeldungStatusFilter['exportiert']) {
                        return r.exported || preismeldungenStatus[r.pmId] != null;
                    }
                    return (
                        !r.exported &&
                        preismeldungenStatus[r.pmId] != null &&
                        preismeldungenStatus[r.pmId] <= statusFilter
                    );
                })
                .map((r, i) => ({
                    ...r,
                    isEditable: preismeldungenStatus[r.pmId] < P.Models.PreismeldungStatus.geprüft,
                    values: r.values.map(c => this.enhanceColumn(c)),
                    behindMarked: i < marked,
                    marked: i === marked,
                })),
        ),
        publishReplay(1),
        refCount(),
    );

    constructor(private domSanitizer: DomSanitizer, pefDialogService: PefDialogService) {
        super();

        this.reportData$.pipe(takeUntil(this.onDestroy$)).subscribe(this.cleanupMarked$);

        this.controllingType$ = this.reportData$.pipe(
            filter(x => x != null),
            map(x => x.controllingType),
        );
        this.preismeldungStatusFilter$.pipe(takeUntil(this.onDestroy$)).subscribe(this.cleanupMarked$);

        // Cleanup marked if amount of shown pm has changed
        this.preismeldungen$
            .pipe(
                map(pm => pm && pm.length),
                distinctUntilChanged(),
            )
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(this.cleanupMarked$);

        this.hiddenColumns$ = this.toggleColumn$.asObservable().pipe(
            scan(
                (columns, i) => {
                    columns[i] = !columns[i];
                    return columns;
                },
                [] as boolean[],
            ),
            startWith([]),
            publishReplay(1),
            refCount(),
        );

        this.hasStatusInputDisabled$ = this.controllingTypeSelected$.pipe(
            startWith(first(this.controllings).name),
            mergeO(
                this.reportData$.pipe(
                    filter(x => !!x && !!x.controllingType),
                    map(x => x.controllingType),
                ),
            ),
            map(type => ControllingTypesWithoutPmStatus.some(x => x === type)),
            publishReplay(1),
            refCount(),
        );

        const confirmUpdateStatusDialog$ = (hasMarker: boolean) =>
            defer(() =>
                pefDialogService
                    .displayDialog(PefDialogPmStatusSelectionComponent, {
                        dialogOptions: { backdropDismiss: true },
                        params: { hasMarker },
                    })
                    .pipe(
                        map(x => x.data),
                        filter(data => !!data && data.type === 'CONFIRM_SAVE'),
                    ),
            );

        this.updateAllPmStatus$ = this.updateAllPmStatusClicked$.pipe(
            withLatestFrom(this.currentlyMarked$),
            switchMap(([, marked]) =>
                confirmUpdateStatusDialog$(marked !== null).pipe(map(data => ({ data, marked }))),
            ),
            withLatestFrom(this.preismeldungen$, this.preismeldungenStatus$),
            map(([{ data, marked }, preismeldungen, preismeldungenStatus]) =>
                (data.value.toMarker ? preismeldungen.slice(0, marked + 1) : preismeldungen)
                    .filter(pm => pm.canView && preismeldungenStatus[pm.pmId] != null)
                    .map(({ pmId }) => ({ pmId, status: data.value.pmStatus })),
            ),
            shareReplay({ bufferSize: 1, refCount: true }),
        );
    }

    public enhanceColumn(column: ColumnValue) {
        const formattedValue = this.formatValue(column);
        const value = column.value == null ? '' : column.value;
        return {
            ...column,
            width:
                column.size != null && column.size.fixed != null && value.toString().length > 0
                    ? this.domSanitizer.bypassSecurityTrustStyle(`calc(${column.size.fixed}ch + 11px)`)
                    : null,
            minWidth:
                column.size != null && column.size.min != null && value.toString().length > 0
                    ? this.domSanitizer.bypassSecurityTrustStyle(`calc(${column.size.min}ch + 11px)`)
                    : null,
            formattedValue,
            title: value
                .toString()
                .replace(/&nbsp;/g, ' ')
                .replace(/<br>/g, ' | ')
                .replace(/<.*?>/g, ''),
        };
    }

    public formatValue(column: ColumnValue) {
        if (!column.parseHtml) {
            return column.value;
        }
        return this.domSanitizer.bypassSecurityTrustHtml(column.value);
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    public ngOnDestroy() {
        this.onDestroy$.next();
    }

    public trackByPmId(pm: { pmId: string }) {
        return pm.pmId;
    }
}
