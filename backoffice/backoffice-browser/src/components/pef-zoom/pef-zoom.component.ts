import { Component, EventEmitter, Input, ElementRef, OnDestroy, OnChanges, SimpleChange, Output } from '@angular/core';
import { Observable } from 'rxjs';

import { ReactiveComponent } from 'lik-shared';

@Component({
    selector: 'pef-zoom',
    templateUrl: 'pef-zoom.component.html',
})
export class PefZoomComponent extends ReactiveComponent implements OnDestroy, OnChanges {
    @Input('min') min = 0.5;
    @Input('max') max = 1;
    @Output('zoomLevel') zoomLevel$: Observable<number>;

    public setZoom$ = new EventEmitter<number>();

    private onDestroy$ = new EventEmitter();

    constructor() {
        super();

        this.zoomLevel$ = this.setZoom$
            .startWith(1)
            .scan((acc, value, i) => acc + value)
            .publishReplay(1)
            .refCount();
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.onDestroy$.next();
    }
}
