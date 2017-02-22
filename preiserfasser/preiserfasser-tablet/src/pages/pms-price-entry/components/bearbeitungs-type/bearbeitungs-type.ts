import { Component, EventEmitter, ElementRef, NgZone, forwardRef, HostListener, Output, ChangeDetectionStrategy } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
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

@Component({
    selector: 'bearbeitungs-type',
    templateUrl: 'bearbeitungs-type.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{
        provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => BearbeitungsTypeComponent), multi: true
    }]
})
export class BearbeitungsTypeComponent implements ControlValueAccessor {
    @Output('change') change$: Observable<P.Models.Bearbeitungscode>;
    public buttonClicked$ = new EventEmitter<MouseEvent>();
    public buttonOn$: Observable<boolean>;
    public selectBearbeitungsType$ = new EventEmitter<{event: Event, bearbeitungsType: BearbeitungsType}>();
    public documentClick$ = new EventEmitter<MouseEvent>();
    public marginBottom$: Observable<string>;

    public selectedBearbeitungsType$: Observable<BearbeitungsType>;

    constructor(private elementRef: ElementRef, private zone: NgZone) {
        const bearbeitungsTypeFromInput$ = this.changeFromInput.map(x => this.bearbeitungsTypes.find(y => y.code === x))
            .publishReplay(1);
        bearbeitungsTypeFromInput$.connect();

        this.selectedBearbeitungsType$ = this.selectBearbeitungsType$
            .map(x => x.bearbeitungsType)
            .merge(bearbeitungsTypeFromInput$)
            .startWith(this.bearbeitungsTypes[0])
            .publishReplay(1).refCount();

        this.change$ = this.selectBearbeitungsType$
            .map(x => x.bearbeitungsType.code)
            .publishReplay(1).refCount();

        this.change$
            .subscribe(x => { this._onChange(x); });

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

    registerOnChange(fn: (value: any) => void): void {
        this._onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }

    private changeFromInput = new EventEmitter<any>();
    writeValue(value: any) {
        this.changeFromInput.emit(value);
    }

    public bearbeitungsTypes: BearbeitungsType[] = [
        { code: 100, iconName: 'recommended', description: 'Standardabbuchung', codeName: 'Code 100' },
        { code: 44, iconName: 'recommended', description: 'Saisonales Product nicht vorhanden', codeName: 'Code S/44' },
        { code: 101, iconName: 'recommended', description: 'Aktuell nicht an Lager', codeName: 'Code R' },
        { code: 1, iconName: 'recommended', description: 'Direkter Ersatz', codeName: 'Code 1' },
        { code: 7, iconName: 'recommended', description: 'Verkettung', codeName: 'Code 7' },
        { code: 0, iconName: 'recommended', description: 'Preisereihe beenden', codeName: 'Code 0' }
    ];
}
