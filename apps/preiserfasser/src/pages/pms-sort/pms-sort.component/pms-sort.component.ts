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
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Inject,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChange,
    ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import dragula from 'dragula';
import { assign, findLastIndex, keys, max, minBy, orderBy, sortBy, takeWhile } from 'lodash';
import { WINDOW } from 'ngx-window-token';
import { merge as observableMerge, Observable } from 'rxjs';
import {
    combineLatest,
    delay,
    filter,
    flatMap,
    map,
    mapTo,
    merge,
    publishReplay,
    refCount,
    scan,
    shareReplay,
    startWith,
    take,
    withLatestFrom,
} from 'rxjs/operators';

import { DropPreismeldungArg, initDragula, PefVirtualScrollComponent, ReactiveComponent } from '@lik-shared';

import * as P from '../../../common-models';

// type SelectablePreismeldungBag = P.PreismeldungBag & { selectionIndex: number };
type MultiSelectIndexMap = { [pmId: string]: number };
type SortablePreismeldungBag = P.PreismeldungBag & {
    marked: boolean;
    priority: number;
};

@Component({
    selector: 'pms-sort',
    styleUrls: ['./pms-sort.component.scss'],
    templateUrl: './pms-sort.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PmsSortComponent extends ReactiveComponent implements OnChanges, OnDestroy, OnInit, AfterViewInit {
    @Input() preismeldungen: P.PreismeldungBag[];
    @Input() isDesktop: boolean;

    @Output('save') public save$ = new EventEmitter();
    @Output('preismeldung-sort-save') public preismeldungSortSave$: Observable<
        P.Models.PmsPreismeldungenSortProperties
    >;

    @ViewChild(PefVirtualScrollComponent, { static: false })
    private virtualScroll: any;

    scrollList: Observable<P.PreismeldungBag[]>;

    private drake: dragula.Drake;
    private scroll: any;

    private ngAfterViewInit$ = new EventEmitter();

    public preismeldungen$: Observable<SortablePreismeldungBag[]>;
    public multiselectIndexes$: Observable<MultiSelectIndexMap>;

    public multiSelectClick$ = new EventEmitter();
    public multiSelectResetClick$ = new EventEmitter();
    public cancel$ = new EventEmitter();
    public onDrag$ = new EventEmitter();
    public movePreismeldung$ = new EventEmitter<string>();
    public multiSelectMode$: Observable<boolean>;
    public multipleSelected$: Observable<boolean>;
    public isModified$: Observable<boolean>;
    public isDragging$: Observable<boolean>;
    public selectForMultiselect$ = new EventEmitter<string>();
    public dropPreismeldung$ = new EventEmitter<DropPreismeldungArg>();

    private subscriptions = [];

    constructor(translateService: TranslateService, @Inject(WINDOW) wndw: Window, private el: ElementRef<HTMLElement>) {
        super();

        const allPreismeldungen$ = this.ngAfterViewInit$.pipe(
            delay(100),
            flatMap(() => this.observePropertyCurrentValue<P.PreismeldungBag[]>('preismeldungen')),
            map(preismeldungen => sortBy(preismeldungen, pm => pm.sortierungsnummer)),
            publishReplay(1),
            refCount(),
        );

        type MovePm = { moveTo: DropPreismeldungArg; selected: string };
        const movePm$ = this.movePreismeldung$.pipe(
            merge(this.cancel$.pipe(mapTo(null))),
            scan<string, MovePm>(
                (prev, selected) => {
                    return selected === null || prev.selected === null
                        ? { moveTo: null, selected }
                        : selected === prev.selected
                        ? { moveTo: null, selected: null }
                        : { moveTo: { dropBeforePmId: selected, preismeldungPmId: prev.selected }, selected: null };
                },
                { moveTo: null, selected: null },
            ),
            shareReplay({ bufferSize: 1, refCount: true }),
        );
        const moveToPm$ = movePm$.pipe(
            filter(({ moveTo }) => moveTo !== null),
            map(({ moveTo }) => moveTo),
        );
        const markedToMove$ = movePm$.pipe(
            map(({ selected }) => [selected]),
            startWith([] as string[]),
        );
        this.isDragging$ = observableMerge(
            this.onDrag$.asObservable().pipe(mapTo(true)),
            this.dropPreismeldung$.asObservable().pipe(mapTo(false)),
        );

        const preismeldungen$ = allPreismeldungen$.pipe(
            map(preismeldungen =>
                preismeldungen.slice(findLastIndex(preismeldungen, pm => !!pm.preismeldung.uploadRequestedAt) + 1),
            ),
        );

        this.multiSelectMode$ = this.multiSelectClick$.pipe(
            merge(this.cancel$.pipe(mapTo(true))),
            scan((agg, cancelClicked) => !agg && !cancelClicked, false),
            startWith(false),
            publishReplay(1),
            refCount(),
        );

        type MultiselectAction = { type: 'RESET' } | { type: 'TOGGLE_PM'; payload: string };
        this.multiselectIndexes$ = preismeldungen$.pipe(
            merge(this.multiSelectResetClick$, this.multiSelectMode$),
            map(() => ({ type: 'RESET' })),
            merge(this.selectForMultiselect$.pipe(map(payload => ({ type: 'TOGGLE_PM', payload })))),
            scan((agg: MultiSelectIndexMap, v: MultiselectAction) => {
                if (v.type === 'RESET') return {};
                const preismeldungIndex = agg[v.payload];
                if (!!preismeldungIndex) {
                    const biggerIndexes = keys(agg)
                        .filter(k => agg[k] > preismeldungIndex)
                        .map(k => ({ [k]: agg[k] - 1 }));
                    return assign({}, agg, { [v.payload]: null }, ...biggerIndexes);
                }
                return assign({}, agg, { [v.payload]: (max(keys(agg).map(k => agg[k])) || 0) + 1 });
            }, {}),
            publishReplay(1),
            refCount(),
        );

        this.multipleSelected$ = this.multiselectIndexes$.pipe(map(x => keys(x).filter(k => !!x[k]).length > 1));
        const resetPreismeldungenList$ = this.cancel$.pipe(
            withLatestFrom(preismeldungen$),
            map(([, preismeldungen]) => preismeldungen),
        );

        type PreismeldungenOrderAction =
            | { type: 'RESET'; payload: SortablePreismeldungBag[] }
            | { type: 'DROP_PREISMELDUNG'; payload: DropPreismeldungArg };
        this.preismeldungen$ = preismeldungen$.pipe(
            merge(resetPreismeldungenList$),
            map(payload => ({ type: 'RESET', payload })),
            merge(this.dropPreismeldung$.pipe(map(payload => ({ type: 'DROP_PREISMELDUNG', payload })))),
            merge(moveToPm$.pipe(map(payload => ({ type: 'DROP_PREISMELDUNG', payload })))),
            withLatestFrom(
                this.multiSelectMode$,
                this.multiselectIndexes$.pipe(startWith(null)),
                (
                    preismeldungenOrderAction: PreismeldungenOrderAction,
                    multiSelectMode: boolean,
                    multiselectIndexes: MultiSelectIndexMap,
                ) => ({ preismeldungenOrderAction, multiSelectMode, multiselectIndexes }),
            ),
            scan(
                (agg, v) => {
                    if (v.preismeldungenOrderAction.type === 'RESET') return v.preismeldungenOrderAction.payload;
                    const { dropBeforePmId, preismeldungPmId } = v.preismeldungenOrderAction.payload;
                    const prioritizedPm = orderBy(agg, x => x.sortierungsnummer).map((pm, i) => ({
                        ...pm,
                        priority: i + 1,
                    }));

                    const dropPreismeldungBeforePriority = !dropBeforePmId
                        ? Number.MAX_VALUE
                        : prioritizedPm.find(b => b.pmId === dropBeforePmId).priority;
                    let preismeldungenTemp: (SortablePreismeldungBag & { priority: number })[];
                    if (!v.multiSelectMode) {
                        preismeldungenTemp = prioritizedPm.map(b =>
                            b.pmId === preismeldungPmId
                                ? assign({}, b, { priority: dropPreismeldungBeforePriority - 0.1 })
                                : b,
                        );
                    } else {
                        const preismeldungenToMove = orderBy(
                            keys(v.multiselectIndexes)
                                .filter(k => !!v.multiselectIndexes[k])
                                .map(pmId => ({ pmId, selectionIndex: v.multiselectIndexes[pmId] })),
                            x => x.selectionIndex,
                            'desc',
                        );
                        const preismeldungenToMoveOrdered = preismeldungenToMove.map((x, i) => ({
                            pmId: x.pmId,
                            priority: dropPreismeldungBeforePriority - (i + 1) * 0.0001,
                        }));
                        preismeldungenTemp = prioritizedPm.map(b => {
                            const pmWithNewOrder = preismeldungenToMoveOrdered.find(x => x.pmId === b.pmId);
                            return !!pmWithNewOrder ? assign({}, b, { priority: pmWithNewOrder.priority }) : b;
                        });
                    }

                    let minSortNummer = minBy(prioritizedPm, pm => pm.sortierungsnummer).sortierungsnummer;
                    const sortedPm = orderBy(preismeldungenTemp, x => x.priority);
                    const lastSaisonalPmIndex = takeWhile(sortedPm, x => x.sortierungsnummer === 0).length - 1;

                    // If the last saisonal pm has been moved use sortnummer 1
                    if (minSortNummer === 0 && sortedPm[0] && sortedPm[0].sortierungsnummer !== 0) {
                        minSortNummer = 1;
                    }
                    return sortedPm.map((b, i) => {
                        const pm =
                            i > lastSaisonalPmIndex
                                ? {
                                      ...b,
                                      sortierungsnummer:
                                          Math.round(minSortNummer) +
                                          i -
                                          (lastSaisonalPmIndex > 0 ? lastSaisonalPmIndex : 0),
                                  }
                                : b;
                        return { ...pm, selectionIndex: null };
                    });
                },
                [] as SortablePreismeldungBag[],
            ),
            combineLatest(markedToMove$, (preismeldungen, marked) =>
                preismeldungen.map(bag => ({ ...bag, marked: marked.indexOf(bag.pmId) !== -1 })),
            ),
            publishReplay(1),
            refCount(),
        );

        this.subscriptions.push(
            this.preismeldungen$
                .pipe(
                    filter(x => !!x.length),
                    take(1),
                    delay(100),
                )
                .subscribe(() => this.virtualScroll.refresh()),
        );

        this.preismeldungSortSave$ = this.save$.pipe(
            withLatestFrom(this.preismeldungen$, allPreismeldungen$, (_, preismeldungen, allPreismeldungen) => ({
                preismeldungen,
                allPreismeldungen,
            })),
            map(({ preismeldungen, allPreismeldungen }) => ({
                sortOrder: [
                    ...allPreismeldungen
                        .slice(0, findLastIndex(allPreismeldungen, pm => !!pm.preismeldung.uploadRequestedAt) + 1)
                        .map(pm => ({ pmId: pm.pmId, sortierungsnummer: pm.sortierungsnummer })),
                    ...preismeldungen.map(pm => ({ pmId: pm.pmId, sortierungsnummer: pm.sortierungsnummer })),
                ],
            })),
        );

        this.isModified$ = observableMerge(
            this.cancel$.pipe(mapTo(false)),
            this.preismeldungSortSave$.pipe(mapTo(false)),
            this.onDrag$.pipe(mapTo(true)),
            moveToPm$.pipe(mapTo(true)),
        ).pipe(startWith(false));

        this.subscriptions.push(
            this.onDrag$
                .pipe(
                    withLatestFrom(
                        this.multiselectIndexes$.pipe(map(x => keys(x).filter(k => !!x[k]).length)),
                        (_, numPreismeldungenSelected) => numPreismeldungenSelected,
                    ),
                    delay(0),
                )
                .subscribe(numPreismeldungenSelected => {
                    const guMirror = wndw.document.querySelector('.gu-mirror');
                    if (guMirror) {
                        if (numPreismeldungenSelected > 1) {
                            guMirror.classList.add('multiple-selected');
                        }
                        wndw.document.querySelector('.gu-mirror .message').innerHTML = `${numPreismeldungenSelected ||
                            1} ${translateService.instant('label_preismeldungen')}`;
                    }
                    this.el.nativeElement.querySelector('pef-virtual-scroll').classList.add('is-dragging');
                }),
        );
    }

    public ngOnInit() {
        const scrollContainer = this.el.nativeElement.querySelector('pef-virtual-scroll') as HTMLElement;
        [this.drake, this.scroll] = initDragula(scrollContainer, {
            markerSelector: '.box-part',
            dragulaOptions: {
                moves: (el, _container, handle) => {
                    let searchElement = handle;
                    while (searchElement !== el && searchElement.className !== 'drag-handle') {
                        searchElement = searchElement.parentElement;
                    }
                    return searchElement.className === 'drag-handle';
                },
            },
            onDragstart: () => this.onDrag$.emit(),
            onDrop: args => this.dropPreismeldung$.emit(args),
        });
    }

    public ngAfterViewInit() {
        this.ngAfterViewInit$.emit();
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
        this.drake.destroy();
        this.scroll.destroy();
    }
}
