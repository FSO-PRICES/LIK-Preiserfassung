import { Component, EventEmitter, OnDestroy, Input, ViewChild, OnChanges, SimpleChange, ChangeDetectionStrategy, ElementRef, AfterViewInit, OnInit, Inject } from '@angular/core';
import { ReactiveComponent, PefVirtualScrollComponent } from 'lik-shared';

import dragula from 'dragula';
import autoScroll from 'dom-autoscroller';

import * as P from '../../../common-models';
import { Observable } from 'rxjs';
import { assign, max, orderBy } from 'lodash';

type SelectablePreismeldungBag = P.PreismeldungBag & { selectionIndex: number };
type DropPreismeldungArg = { preismeldungPmId: string, dropBeforePmId: string };

@Component({
    selector: 'pms-sort',
    templateUrl: 'pms-sort.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PmsSortComponent extends ReactiveComponent implements OnChanges, OnDestroy, OnInit, AfterViewInit {
    @Input() preismeldungen: P.PreismeldungBag[];
    @Input() isDesktop: boolean;
    isDesktop$ = this.observePropertyCurrentValue<boolean>('isDesktop');

    @ViewChild(PefVirtualScrollComponent)
    private virtualScroll: any;

    private drake: dragula.Drake;
    private scroll: any;

    private ngAfterViewInit$ = new EventEmitter();

    private preismeldungen$: Observable<P.PreismeldungBag[]>;

    public save$ = new EventEmitter();
    public multiSelectClick$ = new EventEmitter();
    public multiSelectMode$: Observable<boolean>;
    public selectForMultiselect$ = new EventEmitter<string>();
    public dropPreismeldung$ = new EventEmitter<DropPreismeldungArg>();

    private subscriptions = [];

    private theList = ['a', 'b', 'c']

    constructor(private el: ElementRef) {
        super();

        const preismeldungen$ = this.ngAfterViewInit$
            .delay(500)
            .flatMap(() => this.observePropertyCurrentValue<P.PreismeldungBag[]>('preismeldungen'))
            .map(x => x.map(y => assign({}, y, { selectionIndex: null })) as SelectablePreismeldungBag[]);

        this.multiSelectMode$ = this.multiSelectClick$
            .scan((agg, _) => !agg, false)
            .startWith(false)
            .publishReplay(1).refCount();

        enum UserActionType { SELECT_FOR_MULTISLECT, DROP_PAYLOAD };
        const userActions$ = this.selectForMultiselect$.map(payload => ({ type: UserActionType.SELECT_FOR_MULTISLECT, payload }))
            .merge(this.dropPreismeldung$.map(payload => ({ type: UserActionType.DROP_PAYLOAD, payload })))
            .startWith(null);
        this.preismeldungen$ = userActions$
            .combineLatest(preismeldungen$, (userActions, origPreismeldungen) => ({ userActions, origPreismeldungen }))
            .withLatestFrom(this.multiSelectMode$, (v, multiSelectMode) => ({ userActions: v.userActions, origPreismeldungen: v.origPreismeldungen, multiSelectMode }))
            .scan((agg: SelectablePreismeldungBag[], v) => {
                if (!v.userActions) return v.origPreismeldungen;
                if (v.userActions.type === UserActionType.SELECT_FOR_MULTISLECT) {
                    const preismeldung = agg.find(p => p.pmId === v.userActions.payload);
                    if (!!preismeldung.selectionIndex) {
                        return agg.map(x => x.pmId === v.userActions.payload ? assign({}, x, { selectionIndex: null }) : x.selectionIndex > preismeldung.selectionIndex ? assign({}, x, { selectionIndex: x.selectionIndex - 1 }) : x);
                    }
                    const maxSelectionIndex = (max(agg.map(x => x.selectionIndex)) || 0) + 1;
                    return agg.map(x => x.pmId === v.userActions.payload ? assign({}, x, { selectionIndex: maxSelectionIndex }) : x);
                }
                const dropPreismeldungBeforeSortierungsNummer = !v.userActions.payload.dropBeforePmId ? Number.MAX_VALUE : agg.find(b => b.pmId === v.userActions.payload.dropBeforePmId).sortierungsnummer;
                let preismeldungenTemp: SelectablePreismeldungBag[];
                if (!v.multiSelectMode) {
                    preismeldungenTemp = agg.map((b, i) => b.pmId === v.userActions.payload.preismeldungPmId ? assign({}, b, { sortierungsnummer: dropPreismeldungBeforeSortierungsNummer - 0.1 }) : b)
                } else {
                    const preismeldungenToMove = orderBy(agg.filter(x => !!x.selectionIndex), x => x.selectionIndex, 'desc');
                    const preismeldungenToMoveOrdered = preismeldungenToMove.map((b, i) => assign({}, b, { sortierungsnummer: dropPreismeldungBeforeSortierungsNummer - (i * 0.0001) }));
                    preismeldungenTemp = agg.map((b, i) => preismeldungenToMoveOrdered.find(x => x.pmId === b.pmId) || b);
                }
                return orderBy(preismeldungenTemp, x => x.sortierungsnummer).map((b, i) => {
                    const pm = b.sortierungsnummer !== i + 1 ? assign({}, b, { sortierungsnummer: i + 1 }) : b;
                    return assign({}, pm, { selectionIndex: null });
                });
            }, []);
        // .do (x => console.log(x))

        this.save$
            .map(() =>
                Array.from<HTMLElement>(this.el.nativeElement.querySelectorAll('.list > .preismeldung-item-draggable'))
                    .map((x, index) => ({ pmId: x.dataset.pmid, sortierungsnummer: index + 1 }))
            )
            .subscribe(x => console.log(x));

    }

    public ngOnInit() {
        const thatDrake = this.drake = dragula([this.el.nativeElement.querySelector('.list')], {
            moves: (el, container, handle) => {
                let searchElement = handle;
                while (searchElement !== el && searchElement.className !== 'drag-handle') {
                    searchElement = searchElement.parentElement;
                }
                console.log(searchElement.className);
                return searchElement.className === 'drag-handle';
            }
        });
        thatDrake.on('drop', (el, target, source, sibling) => {
            const siblingPmId = !!sibling ? sibling.dataset.pmid : null;
            this.dropPreismeldung$.emit({ preismeldungPmId: el.dataset.pmid, dropBeforePmId: siblingPmId });
        })
        this.scroll = autoScroll(
            [this.el.nativeElement.querySelector('.pm-container')], {
                margin: 30,
                maxSpeed: 25,
                scrollWhenOutside: true,
                autoScroll: function () {
                    return this.down && thatDrake.dragging;
                }
            }
        )
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
