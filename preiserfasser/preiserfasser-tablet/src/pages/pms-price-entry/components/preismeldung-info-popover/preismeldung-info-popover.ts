import { Component, EventEmitter, Input, OnChanges, SimpleChange, ElementRef, Inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';

import { ReactiveComponent } from 'lik-shared';

import * as P from '../../../../common-models';

@Component({
    selector: 'preismeldung-info-popover',
    templateUrl: 'preismeldung-info-popover.html'
})
export class PreismeldungInfoPopover extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.PreismeldungBag;

    public preismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('preismeldung');
    public buttonClicked$ = new EventEmitter();
    public popoverActive$: Observable<boolean>;
    public popoverLeft$: Observable<string>;
    public popoverWidth$: Observable<string>;
    public popoverMaxHeight$: Observable<string>;

    public numberFormattingOptions = { padRight: 2, truncate: 2, integerSeparator: '' };

    constructor(elementRef: ElementRef, private sanitizer: DomSanitizer, @Inject('windowObject') window: Window) {
        super();

        this.popoverActive$ = this.buttonClicked$
            .scan<boolean>((active: boolean, _) => !active, false)
            .startWith(false);

        const recalcPopover$ = this.popoverActive$.filter(x => x)
            .publishReplay(1).refCount();

        this.popoverWidth$ = recalcPopover$
            .map(() => `calc(${elementRef.nativeElement.offsetLeft}px + ${elementRef.nativeElement.offsetWidth}px - ${this.pefRelativeSize(window.innerWidth, 1)})`);

        this.popoverLeft$ = recalcPopover$
            .map(() => `calc(${this.pefRelativeSize(window.innerWidth, 1)})`);

        this.popoverMaxHeight$ = recalcPopover$
            .map(() => `calc(${elementRef.nativeElement.offsetParent.clientHeight}px - ${elementRef.nativeElement.offsetTop}px - ${elementRef.nativeElement.clientHeight}px - ${this.pefRelativeSize(window.innerWidth, 1)})`);
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
