/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import { Component, EventEmitter, ElementRef, NgZone, forwardRef, HostListener, Input, Output, ChangeDetectionStrategy, SimpleChange, OnChanges, OnDestroy, HostBinding } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { Observable } from 'rxjs';
import { assign } from 'lodash';
import 'rxjs-ng-extras/add/operator/observeOnZone';

import * as P from '../../models';
import { ReactiveComponent } from '../../../common/ReactiveComponent';

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

export type CodeListType = 'STANDARD' | 'NEW_PM';

@Component({
    selector: 'bearbeitungs-type',
    template: `
        <div style="position: relative;">
            <button ion-button pef-toggle-button [toggleOn]="buttonOn$ | async" color="mercury" class="code-button" (click)="buttonClicked$.emit($event)"
                [disabled]="readonly$ | async">
                <div class="code-name" [class.highlighted]="(selectedBearbeitungsType$ | async)?.code != 99">{{ 'text_code' | translate }}&nbsp;{{ (selectedBearbeitungsType$ | async)?.codeName }}</div>
                <div class="description">{{ ((selectedBearbeitungsType$ | async)?.description) | translate }}</div>
            </button>
            <div class="bearbeitungs-type-flyout" [class.visible]="buttonOn$ | async" [style.marginBottom]="marginBottom$ | async">
                <ion-list>
                    <ion-item tappable class="bearbeitungs-type-option" *ngFor="let bearbeitungsType of (bearbeitungsTypes$ | async)" (click)="selectBearbeitungsType$.emit({event: $event, bearbeitungsType: bearbeitungsType})">
                        <div class="icon">
                            <pef-icon [name]="bearbeitungsType.iconName"></pef-icon>
                        </div>
                        <div class="code-name">{{ 'text_code' | translate }}&nbsp;{{ bearbeitungsType.codeName }}</div>
                        <div class="description">{{ bearbeitungsType.description | translate }}</div>
                    </ion-item>
                </ion-list>
            </div>
        </div>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{
        provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => BearbeitungsTypeComponent), multi: true
    }]
})
export class BearbeitungsTypeComponent extends ReactiveComponent implements ControlValueAccessor, OnChanges, OnDestroy {
    @Input() codeListType: CodeListType = 'STANDARD';
    @Input() nichtEmpfohleneBc: P.Models.Bearbeitungscode[];
    @HostBinding('class.readonly') @Input() readonly: boolean;
    @Output('change') change$: Observable<P.Models.Bearbeitungscode>;

    public codeListType$ = this.observePropertyCurrentValue<CodeListType>('codeListType');
    public readonly$ = this.observePropertyCurrentValue<boolean>('readonly');

    public buttonClicked$ = new EventEmitter<MouseEvent>();
    public buttonOn$: Observable<boolean>;
    public selectBearbeitungsType$ = new EventEmitter<{ event: Event, bearbeitungsType: BearbeitungsType }>();
    public documentClick$ = new EventEmitter<MouseEvent>();
    public marginBottom$: Observable<string>;

    public bearbeitungsTypes$: Observable<BearbeitungsType[]>;

    public selectedBearbeitungsType$: Observable<BearbeitungsType>;

    private subscriptions = [];

    constructor(private elementRef: ElementRef, private zone: NgZone) {
        super();

        this.bearbeitungsTypes$ = this.codeListType$
            .map(codeListType => codeListType === 'NEW_PM' ? this.newPmBearbeitungsTypes : this.standardBearbeitungsTypes)
            .combineLatest(this.observePropertyCurrentValue<P.Models.Bearbeitungscode[]>('nichtEmpfohleneBc'), (bearbeitungsTypes, nichtEmpfohleneBc) =>
                bearbeitungsTypes.map(x => (nichtEmpfohleneBc || []).some(y => y === x.code) ? assign({}, x, { iconName: 'not_recommended' }) : x)
            )
            .publishReplay(1).refCount();

        const bearbeitungsTypeFromInput$ = this.changeFromInput$
            .combineLatest(this.bearbeitungsTypes$, (changeFromInput, bearbeitungsTypes) => ({ changeFromInput, bearbeitungsTypes }))
            .map(x => x.bearbeitungsTypes.find(y => y.code === x.changeFromInput))
            .publishReplay(1);
        bearbeitungsTypeFromInput$.connect();

        this.selectedBearbeitungsType$ = this.selectBearbeitungsType$
            .map(x => x.bearbeitungsType)
            .merge(bearbeitungsTypeFromInput$)
            .startWith(this.standardBearbeitungsTypes[0])
            .publishReplay(1).refCount();

        this.change$ = this.selectBearbeitungsType$
            .map(x => x.bearbeitungsType.code)
            .publishReplay(1).refCount();

        this.subscriptions.push(this.change$.subscribe(x => { this._onChange(x); }));

        this.buttonOn$ = this.buttonClicked$.do(x => { x.cancelBubble = true; })
            .map(() => ({ type: 'TOGGLE' }))
            .merge(this.selectBearbeitungsType$.do(x => { x.event.cancelBubble = true; }).mapTo({ type: 'CLOSE' }))
            .merge(this.documentClick$.mapTo({ type: 'CLOSE' }))
            .scan((agg, v) => v.type === 'TOGGLE' ? !agg : false, false)
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

    _onChange = (value: any) => { };
    _onTouched: () => any = () => { };

    registerOnChange(fn: (value: any) => void): void {
        this._onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }

    private changeFromInput$ = new EventEmitter<any>();
    writeValue(value: any) {
        this.changeFromInput$.emit(value);
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }

    private codeToBearbeitungsType = (code: P.Models.Bearbeitungscode) => ({
        code,
        iconName: 'recommended',
        description: `bearbeitungscode_${code}`,
        codeName: P.Models.bearbeitungscodeDescriptions[code]
    });

    public standardBearbeitungsTypes: BearbeitungsType[] = [99, 44, 101, 1, 7, 0].map(this.codeToBearbeitungsType);
    public newPmBearbeitungsTypes: BearbeitungsType[] = [2, 3].map(this.codeToBearbeitungsType);
}
