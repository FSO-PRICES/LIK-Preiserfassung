import { Component, Input, Self, Optional, Output, EventEmitter, ElementRef, ChangeDetectionStrategy, NgZone, forwardRef, HostListener } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, NgControl } from '@angular/forms';
import { Observable } from 'rxjs';
import 'rxjs-ng-extras/add/operator/observeOnZone';

import * as P from 'lik-shared';

interface BearbeitungsType {
    code: P.Models.Bearbeitungscode;
    iconName: string;
    description: string;
    codeName: string;
}

export interface BeaurbeitungsTypeChange {
    source: BearbeitungsTypeComponent;
    value: any;
}

// const PEF_BEARBEITUNGS_TYPE_VALUE_ACCESSOR: any = {
//     provide: NG_VALUE_ACCESSOR,
//     useExisting: forwardRef(() => BearbeitungsTypeComponent),
//     multi: true
// };

@Component({
    selector: 'bearbeitungs-type',
    templateUrl: 'bearbeitungs-type.html',
    changeDetection: ChangeDetectionStrategy.OnPush
    // providers: [PEF_BEARBEITUNGS_TYPE_VALUE_ACCESSOR]
})
export class BearbeitungsTypeComponent implements ControlValueAccessor {
    @Output() change = new EventEmitter<BeaurbeitungsTypeChange>();

    public buttonClicked$ = new EventEmitter<MouseEvent>();
    public buttonOn$: Observable<boolean>;
    public selectBearbeitungsType$ = new EventEmitter<{event: Event, bearbeitungsType: BearbeitungsType}>();
    public documentClick$ = new EventEmitter<MouseEvent>();
    public marginBottom$: Observable<string>;

    public selectedBearbeitungsType$: Observable<BearbeitungsType>;

    constructor(private elementRef: ElementRef, private zone: NgZone, @Self() @Optional() public _control: NgControl) {
        if (this._control) {
            this._control.valueAccessor = this;
        }
        // const bearbeitungsTypeFromInput$ = this.changeFromInput.map(x => this.bearbeitungsTypes.find(y => y.code === x))
        //     .publishReplay(1);
        // bearbeitungsTypeFromInput$.connect();

        // this.selectedBearbeitungsType$ = this.selectBearbeitungsType$
        //     .map(x => x.bearbeitungsType)
        //     .merge(bearbeitungsTypeFromInput$)
        //     .startWith(this.bearbeitungsTypes[0])
        //     .publishReplay(1).refCount();

        // this.selectBearbeitungsType$
        //     .map(x => x.bearbeitungsType.code)
        //     .distinctUntilChanged()
        //     .subscribe(x => {
        //         this._value = x;
        //         this._emitChangeEvent();
        //     });

        this.buttonOn$ = this.buttonClicked$.do(x => { x.cancelBubble = true; }).mapTo({ type: 'TOGGLE' })
            .merge(this.selectBearbeitungsType$.do(x => { x.event.cancelBubble = true; }).mapTo({ type: 'CLOSE' }))
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

    @HostListener('document:click')
    documentClick($event) {
        this.documentClick$.emit($event);
    }

    _onChange = (value: any) => {};
    _onTouched: () => any = () => { };
    // private _value: any = null;
    // private changeFromInput = new EventEmitter<any>();

    registerOnChange(fn: (value: any) => void): void {
        this._onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }

    // @Input()
    // get value(): any {
    //     return this._value;
    // }

    // set value(newValue: any) {
    //     if (this._value !== newValue) {
    //         this._value = newValue;

    //         this.changeFromInput.next(newValue);
    //         this._emitChangeEvent();
    //     }
    // }

    writeValue(value: any) {
        // this.value = value;
        this._emitChangeEvent(value)
    }

    private _emitChangeEvent(value) {
        const event: BeaurbeitungsTypeChange = {
            source: this,
            value
        };
        this._onChange(value);
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

    public bearbeitungsTypes: BearbeitungsType[] = [
        { code: 100, iconName: 'recommended', description: 'Standardabbuchung', codeName: 'Code 100' },
        { code: 44, iconName: 'recommended', description: 'Saisonales Product nicht vorhanden', codeName: 'Code S/44' },
        { code: 101, iconName: 'recommended', description: 'Aktuell nicht an Lager', codeName: 'Code R' },
        { code: 1, iconName: 'recommended', description: 'Direkter Ersatz', codeName: 'Code 1' },
        { code: 7, iconName: 'recommended', description: 'Verkettung', codeName: 'Code 7' },
        { code: 0, iconName: 'recommended', description: 'Preisereihe beenden', codeName: 'Code 0' }
    ];
}
