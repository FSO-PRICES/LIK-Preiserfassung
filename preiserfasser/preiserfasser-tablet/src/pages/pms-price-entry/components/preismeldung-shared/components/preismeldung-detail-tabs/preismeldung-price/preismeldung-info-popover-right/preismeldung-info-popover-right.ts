import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ElementRef, Inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';

import { ReactiveComponent, formatPercentageChange, preisNumberFormattingOptions, mengeNumberFormattingOptions } from 'lik-shared';

import * as P from '../../../../models';

@Component({
    selector: 'preismeldung-info-popover-right',
    templateUrl: 'preismeldung-info-popover-right.html'
})
export class PreismeldungInfoPopoverRight extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.PreismeldungBag;
    @Input() forceClose: {};
    @Input() height: string;
    @Input() popoverLeft: string;
    @Input() width: string;
    @Output('popoverActive') popoverActive$: Observable<boolean>;

    public preismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('preismeldung');
    public buttonClicked$ = new EventEmitter();
    public popoverLeft$: Observable<string>;
    public popoverWidth$: Observable<string>;
    public popoverHeight$: Observable<string>;
    public popoverMaxHeight$: Observable<string>;
    public comparisonContainerWidth$: Observable<number>;

    public preisNumberFormattingOptions = preisNumberFormattingOptions;
    public mengeNumberFormattingOptions = mengeNumberFormattingOptions;

    constructor(private elementRef: ElementRef, private sanitizer: DomSanitizer, @Inject('windowObject') window: any) {
        super();

        this.comparisonContainerWidth$ = Observable.of(300);

        this.popoverActive$ = this.buttonClicked$.map(x => ({ type: 'TOGGLE' }))
            .merge(this.observePropertyCurrentValue<{}>('forceClose').map(_ => ({ type: 'SET', value: false })))
            .scan<{ type: 'TOGGLE' | 'SET', value?: boolean; }, boolean>((active: boolean, v) => {
                if (v.type === 'TOGGLE') return !active;
                return v.value;
            }, false)
            .startWith(false)
            .publishReplay(1).refCount();

        const recalcPopover$ = this.popoverActive$.filter(x => x)
            .publishReplay(1).refCount();

        this.popoverWidth$ = recalcPopover$
            .map(() => this.width);

        this.popoverHeight$ = recalcPopover$
            .map(() => `calc(${this.height || '0px'} + 1px)`);

        this.popoverLeft$ = recalcPopover$
            .map(() => `calc(${this.popoverLeft} + ${this.pefRelativeSize(window.innerWidth, 1)})`)

        this.popoverMaxHeight$ = recalcPopover$
            .map(() => `calc(${elementRef.nativeElement.offsetParent.clientHeight}px - ${elementRef.nativeElement.offsetTop}px - ${elementRef.nativeElement.clientHeight}px - ${this.pefRelativeSize(window.innerWidth, 1)})`);
    }

    formatPercentageChange = percentageChange => formatPercentageChange(percentageChange, 1);

    ngOnInit() {
        console.log(this.elementRef);
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    pefRelativeSize(windowWidth: number, n: number) {
        return windowWidth <= 1280
            ? `(${n} * 1em)`
            : `(${n} * 16px)`;
    }
}
