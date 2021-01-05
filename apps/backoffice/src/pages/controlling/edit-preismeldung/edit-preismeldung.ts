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
import {
    delay,
    filter,
    map,
    mapTo,
    merge,
    publishReplay,
    refCount,
    scan,
    startWith,
    withLatestFrom,
} from 'rxjs/operators';

import { ReactiveComponent } from '@lik-shared';
import * as P from '../../../common-models';

@Component({
    selector: 'edit-preismeldung',
    templateUrl: 'edit-preismeldung.html',
    styleUrls: ['edit-preismeldung.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditPreismeldungComponent extends ReactiveComponent implements OnChanges {
    @Input() currentPreismeldung: P.CurrentPreismeldungBag;
    @Input() warenkorb: P.fromWarenkorb.WarenkorbInfo[];
    @Input() preismeldestelle: P.Models.Preismeldestelle;
    @Input() preiserheber: P.Models.Erheber;
    @Input() preismeldungenStatus: { [pmId: string]: P.Models.PreismeldungStatus };
    @Output('updatePreismeldungPreis') updatePreismeldungPreis$ = new EventEmitter<P.PreismeldungPricePayload>();
    @Output('updatePreismeldungMessages')
    updatePreismeldungMessages$ = new EventEmitter<P.PreismeldungMessagesPayload>();
    @Output('updatePreismeldungAttributes') updatePreismeldungAttributes$ = new EventEmitter<string[]>();
    @Output('savePreismeldungMessages') savePreismeldungMessages$: Observable<{}>;
    @Output('savePreismeldungAttributes') savePreismeldungAttributes$: Observable<{}>;
    @Output('closeClicked') closeClicked$: Observable<{}>;
    @Output('savePreismeldungPrice') savePreismeldungPrice$ = new EventEmitter<P.SavePreismeldungPriceSaveAction>();
    @Output('kommentarClearClicked') kommentarClearClicked$ = new EventEmitter<{}>();
    @Output('resetPreismeldung') resetPreismeldung$ = new EventEmitter();
    @Output('setPreismeldungStatus')
    setPreismeldungStatus$ = new EventEmitter<{ pmId: string; status: P.Models.PreismeldungStatus }>();

    public selectTab$ = new EventEmitter<string>();
    public currentPreismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungBag>('currentPreismeldung');
    public warenkorb$ = this.observePropertyCurrentValue<P.fromWarenkorb.WarenkorbInfo[]>('warenkorb');
    public toolbarButtonClicked$ = new EventEmitter<string>();
    public requestPreismeldungQuickEqual$: Observable<{}>;
    public selectedTab$: Observable<string>;
    public _closeClicked$ = new EventEmitter();
    public disableQuickEqual$ = new EventEmitter<boolean>();
    public quickEqualDisabled$: Observable<boolean>;

    public duplicatePreismeldung$ = new EventEmitter();
    public requestSelectNextPreismeldung$ = new EventEmitter();
    public requestThrowChanges$ = new EventEmitter();

    constructor() {
        super();

        // Wrapped the disable event emitter into a delay 0 observable due to ExpressionChangedAfterItHasBeenCheckedError error
        this.quickEqualDisabled$ = this.disableQuickEqual$.asObservable().pipe(
            delay(0),
            publishReplay(1),
            refCount(),
        );

        this.selectedTab$ = this.selectTab$.pipe(
            merge(
                this.savePreismeldungPrice$.pipe(
                    filter(x => x.type === 'NO_SAVE_NAVIGATE' || x.type === 'SAVE_AND_NAVIGATE_TAB'),
                    map(
                        (
                            x:
                                | P.SavePreismeldungPriceSaveActionNoSaveNavigate
                                | P.SavePreismeldungPriceSaveActionSaveNavigateTab,
                        ) => x.tabName,
                    ),
                ),
                this.resetPreismeldung$.pipe(
                    withLatestFrom(this.currentPreismeldung$),
                    filter(([, pm]) => !pm.refPreismeldung),
                    mapTo('PREISMELDUNG'),
                ),
            ),
            startWith('PREISMELDUNG'),
            publishReplay(1),
            refCount(),
        );

        const tabPair$ = this.selectedTab$.pipe(
            scan((agg, v) => ({ from: agg.to, to: v }), { from: null, to: null }),
            publishReplay(1),
            refCount(),
        );

        const createTabLeaveObservable = (tabName: string) =>
            tabPair$.pipe(
                filter(x => x.from === tabName),
                merge(
                    this._closeClicked$.pipe(
                        withLatestFrom(tabPair$, (_, tabPair) => tabPair),
                        filter(x => x.to === tabName),
                    ),
                ),
            );

        this.requestPreismeldungQuickEqual$ = this.toolbarButtonClicked$.pipe(
            filter(x => x === 'PREISMELDUNG_QUICK_EQUAL'),
            map(() => new Date()),
        );

        this.savePreismeldungMessages$ = createTabLeaveObservable('MESSAGES').pipe(
            withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung) => currentPreismeldung),
            filter(
                currentPreismeldung =>
                    !!currentPreismeldung && !currentPreismeldung.isNew && currentPreismeldung.isMessagesModified,
            ),
        );

        this.savePreismeldungAttributes$ = createTabLeaveObservable('PRODUCT_ATTRIBUTES').pipe(
            withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung) => currentPreismeldung),
            filter(currentPreismeldung => !currentPreismeldung.isNew && currentPreismeldung.isAttributesModified),
        );

        this.closeClicked$ = this._closeClicked$;
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
