import { Component, EventEmitter, Input, OnChanges, Output, SimpleChange } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { first } from 'lodash';
import { Observable } from 'rxjs';
import {
    combineLatest,
    filter,
    map,
    merge,
    publishReplay,
    refCount,
    scan,
    startWith,
    withLatestFrom,
} from 'rxjs/operators';

import { ReactiveComponent } from '@lik-shared';

import { CONTROLLING_0830, CONTROLLING_TYPE, ControllingTypesWithoutPmStatus } from '../../../actions/controlling';
import * as P from '../../../common-models';
import { ColumnValue, ShortColumnNames } from '../../../reducers/controlling';

@Component({
    selector: 'controlling-report',
    templateUrl: 'controlling-report.html',
    styleUrls: ['controlling-report.scss'],
})
export class ControllingReportComponent extends ReactiveComponent implements OnChanges {
    @Input() reportData: P.ControllingReportData;
    @Input() preismeldungenStatus: { [pmId: string]: P.Models.PreismeldungStatus };
    @Output('setPreismeldungStatus')
    setPreismeldungStatus$ = new EventEmitter<{ pmId: string; status: P.Models.PreismeldungStatus }>();
    @Output('runReport') runReport$ = new EventEmitter<string>();
    @Output('editPreismeldungId') editPreismeldungId$ = new EventEmitter<string>();
    @Output('completeAllPreismeldungenStatus') completeAllPreismeldungenStatus$: Observable<string[]>;

    public completeAllPreismeldungenStatusClicked$ = new EventEmitter();
    public setPreismeldungStatusFilter$ = new EventEmitter<number>();
    public preismeldungStatusFilter$: Observable<number>;
    public controllingTypeSelected$ = new EventEmitter<CONTROLLING_TYPE>();
    public zoomLevel$ = new EventEmitter<number>();
    public toggleColumn$ = new EventEmitter<number>();
    public hiddenColumns$: Observable<boolean[]>;
    public hasStatusInputDisabled$: Observable<boolean>;
    public controllingType$: Observable<string>;
    public shortColumnNames = ShortColumnNames;

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
        publishReplay(1),
        refCount(),
    );
    public preismeldungenStatus$ = this.observePropertyCurrentValue<{ [pmId: string]: P.Models.PreismeldungStatus }>(
        'preismeldungenStatus',
    ).pipe(
        publishReplay(1),
        refCount(),
    );

    public preismeldungen$: Observable<
        {
            exported: boolean;
            pmId: string;
            canView: boolean;
            values: ColumnValue[];
        }[]
    >;

    constructor(private domSanitizer: DomSanitizer) {
        super();

        this.controllingType$ = this.reportData$.pipe(
            filter(x => x != null),
            map(x => x.controllingType),
        );
        this.preismeldungStatusFilter$ = this.setPreismeldungStatusFilter$.asObservable().pipe(
            startWith(P.Models.PreismeldungStatusFilter.exportiert),
            publishReplay(1),
            refCount(),
        );
        this.preismeldungen$ = this.reportData$.pipe(
            combineLatest(this.preismeldungStatusFilter$, this.preismeldungenStatus$),
            filter(([x]) => !!x && !!x.rows),
            map(([x, statusFilter, preismeldungenStatus]) =>
                x.rows.filter(r => {
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
                }),
            ),
        );
        this.completeAllPreismeldungenStatus$ = this.completeAllPreismeldungenStatusClicked$.pipe(
            withLatestFrom(this.preismeldungen$, this.preismeldungenStatus$),
            map(([_, preismeldungen, preismeldungenStatus]) =>
                preismeldungen.filter(pm => pm.canView && preismeldungenStatus[pm.pmId] != null).map(pm => pm.pmId),
            ),
        );

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
            merge(
                this.reportData$.pipe(
                    filter(x => !!x && !!x.controllingType),
                    map(x => x.controllingType),
                ),
            ),
            map(type => ControllingTypesWithoutPmStatus.some(x => x === type)),
            publishReplay(1),
            refCount(),
        );
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
}
