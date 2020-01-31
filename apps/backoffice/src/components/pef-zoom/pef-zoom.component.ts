import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount, scan, startWith } from 'rxjs/operators';

@Component({
    selector: 'pef-zoom',
    templateUrl: 'pef-zoom.component.html',
    styleUrls: ['pef-zoom.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PefZoomComponent {
    @Input() min = 0.5;
    @Input() max = 1;
    @Output('zoomLevel') zoomLevel$: Observable<string>;

    public setZoom$ = new EventEmitter<number>();
    public _zoomLevel$: Observable<number>;

    constructor() {
        this._zoomLevel$ = this.setZoom$.pipe(
            scan((acc, value, i) => +(acc + value).toPrecision(1), 1),
            startWith(1),
            publishReplay(1),
            refCount(),
        );
        this.zoomLevel$ = this._zoomLevel$.pipe(map(zoom => `${zoom}em`));
    }
}
