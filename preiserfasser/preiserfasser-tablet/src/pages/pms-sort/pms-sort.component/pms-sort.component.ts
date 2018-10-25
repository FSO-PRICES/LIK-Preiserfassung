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

import { Component, EventEmitter, OnDestroy, Input, ViewChild, OnChanges, SimpleChange, ChangeDetectionStrategy, ElementRef, AfterViewInit, OnInit, Inject, Output } from '@angular/core';
import { ReactiveComponent, PefVirtualScrollComponent } from 'lik-shared';

import dragula from 'dragula';
import autoScroll from 'dom-autoscroller';

import * as P from '../../../common-models';
import { Observable } from 'rxjs';
import { assign, max, orderBy, keys } from 'lodash';
import { TranslateService } from "@ngx-translate/core";

// type SelectablePreismeldungBag = P.PreismeldungBag & { selectionIndex: number };
type DropPreismeldungArg = { preismeldungPmId: string, dropBeforePmId: string };
type MultiSelectIndexMap = { [pmId: string]: number };


@Component({
    selector: 'pms-sort',
    templateUrl: 'pms-sort.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PmsSortComponent extends ReactiveComponent implements OnChanges, OnDestroy, OnInit, AfterViewInit {
    @Input() preismeldungen: P.PreismeldungBag[];
    @Input() isDesktop: boolean;
    isDesktop$ = this.observePropertyCurrentValue<boolean>('isDesktop');

    @Output('cancel') cancel$ = new EventEmitter();
    @Output('save') public save$ = new EventEmitter();
    @Output('preismeldung-sort-save') public preismeldungSortSave$: Observable<P.Models.PmsPreismeldungenSortProperties>;

    @ViewChild(PefVirtualScrollComponent)
    private virtualScroll: any;

    scrollList: Observable<P.PreismeldungBag[]>;

    private drake: dragula.Drake;
    private scroll: any;

    private ngAfterViewInit$ = new EventEmitter();

    private preismeldungen$: Observable<P.PreismeldungBag[]>;
    private multiselectIndexes$: Observable<MultiSelectIndexMap>;

    public multiSelectClick$ = new EventEmitter();
    public multiSelectResetClick$ = new EventEmitter();
    public onDrag$ = new EventEmitter();
    public multiSelectMode$: Observable<boolean>;
    public multipleSelected$: Observable<boolean>;
    public selectForMultiselect$ = new EventEmitter<string>();
    public dropPreismeldung$ = new EventEmitter<DropPreismeldungArg>();

    private subscriptions = [];

    constructor(private el: ElementRef, @Inject('windowObject') private window: any, private translateService: TranslateService) {
        super();

        const preismeldungen$ = this.ngAfterViewInit$
            .delay(100)
            .flatMap(() => this.observePropertyCurrentValue<P.PreismeldungBag[]>('preismeldungen'))
            .publishReplay(1).refCount();

        this.multiSelectMode$ = this.multiSelectClick$
            .scan((agg, _) => !agg, false)
            .startWith(false)
            .publishReplay(1).refCount();

        type MultiselectAction = { type: 'RESET' } | { type: 'TOGGLE_PM', payload: string };
        this.multiselectIndexes$ = preismeldungen$.merge(this.multiSelectResetClick$, this.multiSelectMode$).map(payload => ({ type: 'RESET' }))
            .merge(this.selectForMultiselect$.map(payload => ({ type: 'TOGGLE_PM', payload })))
            .scan((agg: MultiSelectIndexMap, v: MultiselectAction) => {
                if (v.type === 'RESET') return {};
                const preismeldungIndex = agg[v.payload];
                if (!!preismeldungIndex) {
                    const biggerIndexes = keys(agg).filter(k => agg[k] > preismeldungIndex).map(k => ({ [k]: agg[k] - 1 }));
                    return assign({}, agg, { [v.payload]: null }, ...biggerIndexes);
                }
                return assign({}, agg, { [v.payload]: (max(keys(agg).map(k => agg[k])) || 0) + 1 });
            }, {})
            .publishReplay(1).refCount();

        this.multipleSelected$ = this.multiselectIndexes$
            .map(x => keys(x).filter(k => !!x[k]).length > 1);

        type PreismeldungenOrderAction = { type: 'RESET', payload: P.PreismeldungBag[] } | { type: 'DROP_PREISMELDUNG', payload: DropPreismeldungArg };
        this.preismeldungen$ = preismeldungen$.map(payload => ({ type: 'RESET', payload }))
            .merge(this.dropPreismeldung$.map(payload => ({ type: 'DROP_PREISMELDUNG', payload })))
            .withLatestFrom(this.multiSelectMode$, this.multiselectIndexes$.startWith(null), (preismeldungenOrderAction: PreismeldungenOrderAction, multiSelectMode: boolean, multiselectIndexes: MultiSelectIndexMap) => ({ preismeldungenOrderAction, multiSelectMode, multiselectIndexes }))
            .scan((agg, v) => {
                if (v.preismeldungenOrderAction.type === 'RESET') return v.preismeldungenOrderAction.payload;
                const { dropBeforePmId, preismeldungPmId } = v.preismeldungenOrderAction.payload;
                const dropPreismeldungBeforeSortierungsNummer = !dropBeforePmId ? Number.MAX_VALUE : agg.find(b => b.pmId === dropBeforePmId).sortierungsnummer;
                let preismeldungenTemp: P.PreismeldungBag[];
                if (!v.multiSelectMode) {
                    preismeldungenTemp = agg.map((b, i) => b.pmId === preismeldungPmId ? assign({}, b, { sortierungsnummer: dropPreismeldungBeforeSortierungsNummer - 0.1 }) : b)
                } else {
                    const preismeldungenToMove = orderBy(keys(v.multiselectIndexes).filter(k => !!v.multiselectIndexes[k]).map(pmId => ({ pmId, selectionIndex: v.multiselectIndexes[pmId] })), x => x.selectionIndex, 'desc');
                    const preismeldungenToMoveOrdered = preismeldungenToMove.map((x, i) => ({ pmId: x.pmId, sortierungsnummer: dropPreismeldungBeforeSortierungsNummer - ((i + 1) * 0.0001) }));
                    preismeldungenTemp = agg.map((b, i) => {
                        const pmWithNewOrder = preismeldungenToMoveOrdered.find(x => x.pmId === b.pmId);
                        return !!pmWithNewOrder ? assign({}, b, { sortierungsnummer: pmWithNewOrder.sortierungsnummer }) : b;
                    });
                }
                return orderBy(preismeldungenTemp, x => x.sortierungsnummer).map((b, i) => {
                    const pm = b.sortierungsnummer !== i + 1 ? assign({}, b, { sortierungsnummer: i + 1 }) : b;
                    return assign({}, pm, { selectionIndex: null });
                });
            }, [] as P.PreismeldungBag[]);

        this.subscriptions.push(this.preismeldungen$.filter(x => !!x.length).take(1).delay(100).subscribe(() => this.virtualScroll.refresh()));

        this.preismeldungSortSave$ = this.save$
            .withLatestFrom(this.preismeldungen$, (_, preismeldungen) => preismeldungen)
            .map(preismeldungen => ({ sortOrder: preismeldungen.map(pm => ({ pmId: pm.pmId, sortierungsnummer: pm.sortierungsnummer })) }));

        this.subscriptions.push(
            this.onDrag$
                .withLatestFrom(this.multiselectIndexes$.map(x => keys(x).filter(k => !!x[k]).length), (_, numPreismeldungenSelected) => numPreismeldungenSelected)
                .delay(0)
                .subscribe(numPreismeldungenSelected => {
                    if (numPreismeldungenSelected > 1) this.window.document.querySelector('.gu-mirror').classList.add('multiple-selected');
                    this.window.document.querySelector('.gu-mirror .message').innerHTML = `${numPreismeldungenSelected || 1} ${translateService.instant('label_preismeldungen')}`;
                    this.el.nativeElement.querySelector('pef-virtual-scroll').classList.add('is-dragging');
                })
        );
    }

    public ngOnInit() {
        const thatDrake = this.drake = dragula([this.el.nativeElement.querySelector('pef-virtual-scroll > div.scrollable-content')], {
            moves: (el, container, handle) => {
                let searchElement = handle;
                while (searchElement !== el && searchElement.className !== 'drag-handle') {
                    searchElement = searchElement.parentElement;
                }
                return searchElement.className === 'drag-handle';
            }
        });
        thatDrake.on('drop', (el, target, source, sibling) => {
            const siblingPmId = !!sibling ? sibling.dataset.pmid : null;
            this.dropPreismeldung$.emit({ preismeldungPmId: el.dataset.pmid, dropBeforePmId: siblingPmId });
        });
        thatDrake.on('drag', () => this.onDrag$.emit());
        thatDrake.on('dragend', () => this.el.nativeElement.querySelector('pef-virtual-scroll').classList.remove('is-dragging'));
        this.scroll = autoScroll(
            [this.el.nativeElement.querySelector('pef-virtual-scroll')], {
                margin: 30,
                maxSpeed: 25,
                scrollWhenOutside: true,
                autoScroll: function () {
                    return this.down && thatDrake.dragging;
                }
            }
        );
    }

    public ngAfterViewInit() { this.ngAfterViewInit$.emit() };

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
        this.drake.destroy();
        this.scroll.destroy();
    }
}
