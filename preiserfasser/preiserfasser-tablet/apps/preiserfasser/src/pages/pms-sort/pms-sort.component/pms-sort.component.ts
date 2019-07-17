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
import autoScroll from 'dom-autoscroller';
import dragula from 'dragula';
import { assign, findLastIndex, keys, max, minBy, orderBy, sortBy, takeWhile } from 'lodash';
import { WINDOW } from 'ngx-window-token';
import { merge as observableMerge, Observable } from 'rxjs';
import {
    delay,
    filter,
    flatMap,
    map,
    mapTo,
    merge,
    publishReplay,
    refCount,
    scan,
    startWith,
    take,
    withLatestFrom,
} from 'rxjs/operators';

import { PefVirtualScrollComponent, ReactiveComponent } from '@lik-shared';

import * as P from '../../../common-models';

// type SelectablePreismeldungBag = P.PreismeldungBag & { selectionIndex: number };
type DropPreismeldungArg = { preismeldungPmId: string; dropBeforePmId: string };
type MultiSelectIndexMap = { [pmId: string]: number };

@Component({
    selector: 'pms-sort',
    styleUrls: ['./pms-sort.component.scss'],
    templateUrl: './pms-sort.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PmsSortComponent extends ReactiveComponent implements OnChanges, OnDestroy, OnInit, AfterViewInit {
    @Input() preismeldungen: P.PreismeldungBag[];
    @Input() isDesktop: boolean;

    @Output('cancel') cancel$ = new EventEmitter();
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

    public preismeldungen$: Observable<P.PreismeldungBag[]>;
    public multiselectIndexes$: Observable<MultiSelectIndexMap>;

    public multiSelectClick$ = new EventEmitter();
    public multiSelectResetClick$ = new EventEmitter();
    public onDrag$ = new EventEmitter();
    public multiSelectMode$: Observable<boolean>;
    public multipleSelected$: Observable<boolean>;
    public isModified$: Observable<boolean>;
    public selectForMultiselect$ = new EventEmitter<string>();
    public dropPreismeldung$ = new EventEmitter<DropPreismeldungArg>();

    private subscriptions = [];

    constructor(translateService: TranslateService, @Inject(WINDOW) wndw: Window, private el: ElementRef) {
        super();

        const allPreismeldungen$ = this.ngAfterViewInit$.pipe(
            delay(100),
            flatMap(() => this.observePropertyCurrentValue<P.PreismeldungBag[]>('preismeldungen')),
            map(preismeldungen => sortBy(preismeldungen, pm => pm.sortierungsnummer)),
            publishReplay(1),
            refCount(),
        );

        const preismeldungen$ = allPreismeldungen$.pipe(
            map(preismeldungen =>
                preismeldungen.slice(findLastIndex(preismeldungen, pm => !!pm.preismeldung.uploadRequestedAt) + 1),
            ),
        );

        this.multiSelectMode$ = this.multiSelectClick$.pipe(
            scan((agg, _) => !agg, false),
            startWith(false),
            publishReplay(1),
            refCount(),
        );

        type MultiselectAction = { type: 'RESET' } | { type: 'TOGGLE_PM'; payload: string };
        this.multiselectIndexes$ = preismeldungen$.pipe(
            merge(this.multiSelectResetClick$, this.multiSelectMode$),
            map(payload => ({ type: 'RESET' })),
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

        type PreismeldungenOrderAction =
            | { type: 'RESET'; payload: P.PreismeldungBag[] }
            | { type: 'DROP_PREISMELDUNG'; payload: DropPreismeldungArg };
        this.preismeldungen$ = preismeldungen$.pipe(
            map(payload => ({ type: 'RESET', payload })),
            merge(this.dropPreismeldung$.pipe(map(payload => ({ type: 'DROP_PREISMELDUNG', payload })))),
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
                    let preismeldungenTemp: (P.PreismeldungBag & { priority: number })[];
                    if (!v.multiSelectMode) {
                        preismeldungenTemp = prioritizedPm.map((b, i) =>
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
                        preismeldungenTemp = prioritizedPm.map((b, i) => {
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
                                ? assign({}, b, {
                                      sortierungsnummer:
                                          Math.round(minSortNummer) +
                                          i -
                                          (lastSaisonalPmIndex > 0 ? lastSaisonalPmIndex : 0),
                                  })
                                : b;
                        return assign({}, pm, { selectionIndex: null });
                    });
                },
                [] as P.PreismeldungBag[],
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
            this.preismeldungSortSave$.pipe(
                startWith(),
                mapTo(false),
            ),
            this.onDrag$.pipe(mapTo(true)),
        );

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
                    if (numPreismeldungenSelected > 1)
                        wndw.document.querySelector('.gu-mirror').classList.add('multiple-selected');
                    wndw.document.querySelector('.gu-mirror .message').innerHTML = `${numPreismeldungenSelected ||
                        1} ${translateService.instant('label_preismeldungen')}`;
                    this.el.nativeElement.querySelector('pef-virtual-scroll').classList.add('is-dragging');
                }),
        );
    }

    public ngOnInit() {
        const thatDrake = (this.drake = dragula(
            [this.el.nativeElement.querySelector('pef-virtual-scroll > div.scrollable-content')],
            {
                moves: (el, _container, handle) => {
                    let searchElement = handle;
                    while (searchElement !== el && searchElement.className !== 'drag-handle') {
                        searchElement = searchElement.parentElement;
                    }
                    return searchElement.className === 'drag-handle';
                },
            },
        ));
        thatDrake.on('drop', (el, _target, _source, sibling) => {
            const siblingPmId = !!sibling ? sibling.dataset.pmid : null;
            this.dropPreismeldung$.emit({ preismeldungPmId: el.dataset.pmid, dropBeforePmId: siblingPmId });
        });
        thatDrake.on('drag', e => {
            console.log('on drag', e);
            return this.onDrag$.emit();
        });
        thatDrake.on('dragend', () =>
            this.el.nativeElement.querySelector('pef-virtual-scroll').classList.remove('is-dragging'),
        );
        this.scroll = autoScroll([this.el.nativeElement.querySelector('pef-virtual-scroll')], {
            margin: 30,
            maxSpeed: 25,
            scrollWhenOutside: true,
            autoScroll: function() {
                return this.down && thatDrake.dragging;
            },
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
