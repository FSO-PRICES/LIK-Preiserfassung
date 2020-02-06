import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    HostBinding,
    Inject,
    Input,
    OnChanges,
    Output,
    SimpleChange,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { WINDOW } from 'ngx-window-token';
import { Observable, of as observableOf } from 'rxjs';
import { filter, map, merge, publishReplay, refCount, scan, startWith } from 'rxjs/operators';

import {
    formatPercentageChange,
    mengeNumberFormattingOptions,
    preisNumberFormattingOptions,
    ReactiveComponent,
} from '../../../../../common';
import * as P from '../../../../models';

@Component({
    selector: 'preismeldung-info-popover-right',
    styleUrls: ['./preismeldung-info-popover-right.scss'],
    templateUrl: 'preismeldung-info-popover-right.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldungInfoPopoverRight extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.PreismeldungBag;
    @Input() forceClose: {};
    @Input() height: string;
    @Input() popoverLeft: string;
    @Input() width: string;
    @Input() @HostBinding('class.has-warning') hasWarning = false;
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

    constructor(elementRef: ElementRef, public sanitizer: DomSanitizer, @Inject(WINDOW) private wndw: Window) {
        super();

        this.comparisonContainerWidth$ = observableOf(300);

        this.popoverActive$ = this.buttonClicked$.pipe(
            map(x => ({ type: 'TOGGLE' })),
            merge(this.observePropertyCurrentValue<{}>('forceClose').pipe(map(_ => ({ type: 'SET', value: false })))),
            scan<{ type: 'TOGGLE' | 'SET'; value?: boolean }, boolean>((active: boolean, v) => {
                if (v.type === 'TOGGLE') return !active;
                return v.value;
            }, false),
            startWith(false),
            publishReplay(1),
            refCount(),
        );

        const recalcPopover$ = this.popoverActive$.pipe(
            filter(x => x),
            publishReplay(1),
            refCount(),
        );

        this.popoverWidth$ = recalcPopover$.pipe(map(() => this.width));

        this.popoverHeight$ = recalcPopover$.pipe(map(() => `calc(${this.height || '0px'} + 1px)`));

        this.popoverLeft$ = recalcPopover$.pipe(
            map(() => `calc(${this.popoverLeft} + ${this.pefRelativeSize(wndw.innerWidth, 1)})`),
        );

        this.popoverMaxHeight$ = recalcPopover$.pipe(
            map(
                () =>
                    `calc(${elementRef.nativeElement.offsetParent.clientHeight}px - ${
                        elementRef.nativeElement.offsetTop
                    }px - ${elementRef.nativeElement.clientHeight}px - ${this.pefRelativeSize(wndw.innerWidth, 1)})`,
            ),
        );
    }

    formatPercentageChange = percentageChange => formatPercentageChange(percentageChange, 1);

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    pefRelativeSize(windowWidth: number, n: number) {
        return windowWidth <= 1280 ? `(${n} * 1em)` : `(${n} * 16px)`;
    }
}
