import { Component, EventEmitter, ElementRef, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { ConnectableObservable, Observable } from 'rxjs';
import 'observe-on-zone/add/operator/observeOnZone';
// import { observeOnZone } from 'observeOn';

interface ProcessingCode {
    iconName: string;
    description: string;
    codeName: string;
}

@Component({
    selector: 'processing-code',
    templateUrl: 'processing-code.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '(document:click)': 'documentClick$.emit($event)'
    }
})
export class ProcessingCodeComponent {
    public buttonClicked$ = new EventEmitter<MouseEvent>();
    public buttonOn$: Observable<boolean>;
    public selectProcessingCode$ = new EventEmitter<{event: Event, processingCode: ProcessingCode}>();
    public documentClick$ = new EventEmitter<MouseEvent>();
    public selectedProcessingCode$: Observable<ProcessingCode>;

    public marginBottom$: Observable<string>;

    constructor(private elementRef: ElementRef, private zone: NgZone) {
        this.selectedProcessingCode$ = this.selectProcessingCode$
            .map(x => x.processingCode)
            .startWith(this.processingCodes[0]);

        this.buttonOn$ = this.buttonClicked$.do(x => { x.cancelBubble = true; }).mapTo({ type: 'TOGGLE' })
            .merge(this.selectProcessingCode$.do(x => { x.event.cancelBubble = true; }).mapTo({ type: 'CLOSE' }))
            // .merge(this.documentClick$.filter(x => this._isOutsideThis(x)).mapTo({ type: 'CLOSE' }))
            .merge(this.documentClick$.mapTo({ type: 'CLOSE' }))
            .scan<boolean>((agg, v) => v.type === 'TOGGLE' ? !agg : false, false)
            .startWith(false)
            .distinctUntilChanged()
            .observeOnZone(zone)
            .publishReplay(1).refCount();

        this.marginBottom$ = this.buttonOn$
            .filter(x => x)
            .map(() => this._calculateMarginBottom())
            .startWith('0');
    }

    private _calculateMarginBottom() {
        const buttonElement = this.elementRef.nativeElement.getElementsByClassName('code-button')[0] as Element;
        return `${buttonElement.getBoundingClientRect().height + 4}px`;
    }

    private _isOutsideThis(x) {
        const buttonElement = this.elementRef.nativeElement.getElementsByClassName('code-button')[0] as Element;
        const flyoutElement = this.elementRef.nativeElement.getElementsByClassName('processing-code-flyout')[0] as Element;
        // console.log(x);
        // console.log('button', buttonElement.getBoundingClientRect(), this._isOutsideBoundingBox(x.clientX, x.clientY, buttonElement.getBoundingClientRect()));
        // console.log('flyout', flyoutElement.getBoundingClientRect(), this._isOutsideBoundingBox(x.clientX, x.clientY, flyoutElement.getBoundingClientRect()));
        return this._isOutsideBoundingBox(x.clientX, x.clientY, buttonElement.getBoundingClientRect()) && this._isOutsideBoundingBox(x.clientX, x.clientY, flyoutElement.getBoundingClientRect());
    }

    private _isOutsideBoundingBox(x: number, y: number, rect: { top: number, right: number, bottom: number, left: number }) {
        return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
    }

    public processingCodes: ProcessingCode[] = [
        { iconName: 'recommended', description: 'Standardabbuchung', codeName: 'Code 100' },
        { iconName: 'recommended', description: 'Saisonales Product nicht vorhanden', codeName: 'Code S/44' },
        { iconName: 'recommended', description: 'Aktuell nicht an Lager', codeName: 'Code R' },
        { iconName: 'recommended', description: 'Direkter Ersatz', codeName: 'Code 1' },
        { iconName: 'recommended', description: 'Verkettung', codeName: 'Code 7' },
        { iconName: 'recommended', description: 'Preisereihe beenden', codeName: 'Code 0' },
        { iconName: 'recommended', description: 'Preisereihe beenden + Neue erstellen', codeName: 'Code 0 + 2/3' }
    ];
}
