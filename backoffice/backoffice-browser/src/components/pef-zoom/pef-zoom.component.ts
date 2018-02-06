import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
    selector: 'pef-zoom',
    templateUrl: 'pef-zoom.component.html',
})
export class PefZoomComponent {
    @Input('min') min = 0.5;
    @Input('max') max = 1;
    @Output('zoomLevel') zoomLevel$: Observable<number>;

    public setZoom$ = new EventEmitter<number>();

    constructor() {
        this.zoomLevel$ = this.setZoom$
            .startWith(1)
            .scan((acc, value, i) => acc + value)
            .publishReplay(1)
            .refCount();
    }
}
