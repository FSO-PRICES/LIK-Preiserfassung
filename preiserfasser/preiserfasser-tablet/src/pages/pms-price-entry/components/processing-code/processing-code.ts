import { Component, Input, Output, EventEmitter, ElementRef, ChangeDetectionStrategy, NgZone, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { ConnectableObservable, Observable } from 'rxjs';
import 'rxjs-ng-extras/add/operator/observeOnZone';

const codeTypes = {
    STANDARD_ENTRY: 'STANDARD_ENTRY',
    SEASONAL_PRODUCT_NOT_AVAILABLE: 'SEASONAL_PRODUCT_NOT_AVAILABLE',
    CURRENTLY_NOT_AVAILABLE: 'CURRENTLY_NOT_AVAILABLE',
    DIRECT_REPLACEMENT: 'DIRECT_REPLACEMENT',
    CHAINED_REPLACEMENT: 'CHAINED_REPLACEMENT',
    PRICE_SERIES_END: 'PRICE_SERIES_END',
    PRICE_SERIES_END_AND_CREATE_NEW: 'PRICE_SERIES_END_AND_CREATE_NEW'
};

interface ProcessingCode {
    codeType: string;
    iconName: string;
    description: string;
    codeName: string;
}

export interface ProcessingCodeChange {
    source: ProcessingCodeComponent;
    value: any;
}

const PEF_PROCESSING_CODE_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => ProcessingCodeComponent),
    multi: true
};

@Component({
    selector: 'processing-code',
    templateUrl: 'processing-code.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '(document:click)': 'documentClick$.emit($event)'
    },
    providers: [PEF_PROCESSING_CODE_VALUE_ACCESSOR]
})
export class ProcessingCodeComponent implements ControlValueAccessor {
    @Output() change = new EventEmitter<ProcessingCodeChange>();

    public buttonClicked$ = new EventEmitter<MouseEvent>();
    public buttonOn$: Observable<boolean>;
    public selectProcessingCode$ = new EventEmitter<{event: Event, processingCode: ProcessingCode}>();
    public documentClick$ = new EventEmitter<MouseEvent>();
    public showChainedReplacementFields$: Observable<boolean>;
    public marginBottom$: Observable<string>;

    public selectedProcessingCode$: Observable<ProcessingCode>;

    constructor(private elementRef: ElementRef, private zone: NgZone) {
        const processingCodeFromInput$ = this.changeFromInput.map(x => this.processingCodes.find(y => y.codeType === x))
            .publishReplay(1);
        processingCodeFromInput$.connect();

        this.selectedProcessingCode$ = this.selectProcessingCode$
            .map(x => x.processingCode)
            .merge(processingCodeFromInput$)
            .startWith(this.processingCodes[0])
            .publishReplay(1).refCount();

        this.selectProcessingCode$
            .map(x => x.processingCode.codeType)
            .distinctUntilChanged()
            .subscribe(x => {
                this._value = x;
                this._emitChangeEvent();
            });

        this.buttonOn$ = this.buttonClicked$.do(x => { x.cancelBubble = true; }).mapTo({ type: 'TOGGLE' })
            .merge(this.selectProcessingCode$.do(x => { x.event.cancelBubble = true; }).mapTo({ type: 'CLOSE' }))
            .merge(this.documentClick$.mapTo({ type: 'CLOSE' }))
            .scan<boolean>((agg, v) => v.type === 'TOGGLE' ? !agg : false, false)
            .startWith(false)
            .distinctUntilChanged()
            .observeOnZone(zone)
            .publishReplay(1).refCount();

        this.marginBottom$ = this.buttonOn$
            .filter(x => x)
            .map(() => this._calculateMarginBottom(elementRef))
            .startWith('0');
    }

    private _calculateMarginBottom(elementRef: ElementRef) {
        const buttonElement = elementRef.nativeElement.getElementsByClassName('code-button')[0] as Element;
        return `${buttonElement.getBoundingClientRect().height + 4}px`;
    }

    onTouched: () => any = () => { };
    private _value: any = null;
    private _controlValueAccessorChangeFn: (value: any) => void = (value) => { };
    private changeFromInput = new EventEmitter<any>();

    registerOnChange(fn: (value: any) => void) {
        this._controlValueAccessorChangeFn = fn;
    }

    registerOnTouched(fn: any) {
        this.onTouched = fn;
    }

    @Input()
    get value(): any {
        return this._value;
    }

    set value(newValue: any) {
        const wasOriginallyNull = this._value == null;
        if (this._value !== newValue) {
            this._value = newValue;

            this.changeFromInput.next(newValue);
            if (!wasOriginallyNull) this._emitChangeEvent();
        }
    }

    writeValue(value: any) {
        this.value = value;
    }

    private _emitChangeEvent() {
        const event: ProcessingCodeChange = {
            source: this,
            value: this.value
        }
        this._controlValueAccessorChangeFn(this.value);
        this.change.emit(event);
    }

    // private _isOutsideThis(x) {
    //     const buttonElement = this.elementRef.nativeElement.getElementsByClassName('code-button')[0] as Element;
    //     const flyoutElement = this.elementRef.nativeElement.getElementsByClassName('processing-code-flyout')[0] as Element;
    //     return this._isOutsideBoundingBox(x.clientX, x.clientY, buttonElement.getBoundingClientRect()) && this._isOutsideBoundingBox(x.clientX, x.clientY, flyoutElement.getBoundingClientRect());
    // }

    // private _isOutsideBoundingBox(x: number, y: number, rect: { top: number, right: number, bottom: number, left: number }) {
    //     return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
    // }

    public processingCodes: ProcessingCode[] = [
        { codeType: codeTypes.STANDARD_ENTRY, iconName: 'recommended', description: 'Standardabbuchung', codeName: 'Code 100' },
        { codeType: codeTypes.SEASONAL_PRODUCT_NOT_AVAILABLE, iconName: 'recommended', description: 'Saisonales Product nicht vorhanden', codeName: 'Code S/44' },
        { codeType: codeTypes.CURRENTLY_NOT_AVAILABLE, iconName: 'recommended', description: 'Aktuell nicht an Lager', codeName: 'Code R' },
        { codeType: codeTypes.DIRECT_REPLACEMENT, iconName: 'recommended', description: 'Direkter Ersatz', codeName: 'Code 1' },
        { codeType: codeTypes.CHAINED_REPLACEMENT, iconName: 'recommended', description: 'Verkettung', codeName: 'Code 7' },
        { codeType: codeTypes.PRICE_SERIES_END, iconName: 'recommended', description: 'Preisereihe beenden', codeName: 'Code 0' },
        { codeType: codeTypes.PRICE_SERIES_END_AND_CREATE_NEW, iconName: 'recommended', description: 'Preisereihe beenden + Neue erstellen', codeName: 'Code 0 + 2/3' }
    ];
}
