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

import { Component, Input, OnChanges, SimpleChange, EventEmitter, Output, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { ReactiveComponent } from '../../../../';

import * as P from '../../../models';
import { keys, assign } from 'lodash';
import { Observable } from 'rxjs';

@Component({
    selector: 'preismeldung-attributes',
    template: `
        <preismeldung-readonly-header [preismeldung]="preismeldung$ | async" [preismeldestelle]="preismeldestelle$ | async" [isAdminApp]="isAdminApp$ | async"></preismeldung-readonly-header>

        <ion-content pef-perfect-virtualscroll-scrollbar [enabled]="isDesktop$ | async">
            <form [formGroup]="form">
                <div class="detail-tab-bottom-part">
                    <h3 class="large">{{ 'heading_preismeldung-attributes' | translate }}</h3>
                    <ion-list>
                        <ion-item class="pef-item" *ngFor="let att of (preismeldung$ | async)?.warenkorbPosition.productMerkmale; let i = index">
                            <ion-label>{{ att | pefPropertyTranslate }}</ion-label>
                            <ion-input type="text" [formControlName]="'attribute_' + i" (blur)="fieldEdited$.emit()"></ion-input>
                        </ion-item>
                    </ion-list>
                </div>
            </form>
        </ion-content>`
})
export class PreismeldungAttributesComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() preismeldung: P.Models.Preismeldung;
    @Input() priceCountStatus: P.PriceCountStatus;
    @Input() preismeldestelle: P.Models.Preismeldestelle;
    @Input() isDesktop: boolean;
    @Input() isAdminApp: boolean;

    @Output('preismeldungAttributesPayload') preismeldungAttributesPayload$: Observable<string[]>;

    public fieldEdited$ = new EventEmitter();

    public preismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungBag>('preismeldung');
    public priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');
    public preismeldestelle$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle');
    public isDesktop$ = this.observePropertyCurrentValue<P.WarenkorbInfo[]>('isDesktop');
    public isAdminApp$ = this.observePropertyCurrentValue<P.WarenkorbInfo[]>('isAdminApp');

    form: FormGroup;

    private subscriptions = [];
    constructor(formBuilder: FormBuilder) {
        super();

        this.form = formBuilder.group({
            attribute_0: [''],
            attribute_1: [''],
            attribute_2: [''],
            attribute_3: [''],
            attribute_4: [''],
            attribute_5: [''],
            attribute_6: [''],
            attribute_7: [''],
            attribute_8: [''],
            attribute_9: ['']
        });

        this.subscriptions.push(
            this.preismeldung$
                .filter(bag => !!bag)
                .subscribe(bag => {
                    const formDef = keys(bag.warenkorbPosition.productMerkmale)
                        .reduce((agg, v) => assign(agg, { [`attribute_${v}`]: !!bag.attributes ? bag.attributes[v] : null }), {});
                    this.form.reset(formDef);
                })
        );

        this.preismeldungAttributesPayload$ = this.fieldEdited$
            .withLatestFrom(this.preismeldung$, (_, bag) => {
                const productMerkmale = bag.warenkorbPosition.productMerkmale.map((x, i) => this.form.value[`attribute_${i}`]);
                const isSame = productMerkmale.every((v, i) => bag.attributes[i] === v);
                return isSame ? null : productMerkmale;
            })
            .filter(x => !!x);
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }
}
