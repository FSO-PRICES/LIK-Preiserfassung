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

import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
    OnChanges,
    SimpleChange,
    OnDestroy,
} from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { ReactiveComponent } from '../../../';

import * as P from '../../models';

@Component({
    selector: 'preismeldung-toolbar',
    template: `
    <button *ngIf="!(isAdminApp$ | async)" ion-button icon-only class="pef-tab-button" (click)="otherButtonClicked$.emit('HOME')">
            <pef-icon name="home"></pef-icon>
        </button>
        <div class="preismeldung-buttons" *ngIf="!!preismeldung">
            <button ion-button icon-only class="pef-tab-button" [disabled]="(selectedTab$ | async) == 'INFO_WARENKORB'" [class.selected]="(selectedTab$ | async) == 'INFO_WARENKORB'"
                (click)="selectTab$.emit('INFO_WARENKORB')">
                <pef-icon name="zusatzinfo"></pef-icon>
            </button>
            <button ion-button icon-only class="pef-tab-button" [disabled]="(selectedTab$ | async) == 'PREISMELDUNG_INFO'" [class.selected]="(selectedTab$ | async) == 'PREISMELDUNG_INFO'"
                (click)="selectTab$.emit('PREISMELDUNG_INFO')">
                <pef-icon name="price_tag_info"></pef-icon>
            </button>
            <button ion-button icon-only class="pef-tab-button" [disabled]="(selectedTab$ | async) == 'PRODUCT_ATTRIBUTES' || !(hasAttributes$ | async)"
                [class.selected]="(selectedTab$ | async) == 'PRODUCT_ATTRIBUTES'" (click)="selectTab$.emit('PRODUCT_ATTRIBUTES')">
                <div class="tab-icon-with-warning">
                    <pef-icon name="price_tag"></pef-icon>
                    <pef-icon class="warning-icon" [name]="'warning'" *ngIf="(preismeldung$ | async).hasAttributeWarning"></pef-icon>
                </div>
            </button>
            <button ion-button icon-only class="pef-tab-button" [disabled]="(selectedTab$ | async) == 'MESSAGES'" [class.selected]="(selectedTab$ | async) == 'MESSAGES'"
                (click)="selectTab$.emit('MESSAGES')">
                <div class="tab-icon-with-warning">
                    <pef-icon name="produkteigenschaften"></pef-icon>
                    <pef-icon class="info-icon" [name]="'info'" *ngIf=" (preismeldung$ | async).hasMessageNotiz"></pef-icon>
                    <pef-icon class="warning-icon" [name]="'warning'" *ngIf="(preismeldung$ | async).hasMessageToCheck"></pef-icon>
                </div>
            </button>
            <button ion-button icon-only class="pef-tab-button" [disabled]="(selectedTab$ | async) == 'PREISMELDUNG'" [class.selected]="(selectedTab$ | async) == 'PREISMELDUNG'"
                (click)="selectTab$.emit('PREISMELDUNG')">
                <div class="tab-icon-with-warning">
                    <pef-icon name="notification"></pef-icon>
                    <pef-icon class="warning-icon" [name]="'warning'" *ngIf="(preismeldung$ | async).hasPriceWarning"></pef-icon>
                </div>
            </button>
            <button ion-button icon-only class="pef-toolbar-button" (click)="otherButtonClicked$.emit('PREISMELDUNG_QUICK_EQUAL')" [class.hidden]="((selectedTab$ | async) != 'PREISMELDUNG') || (requestPreismeldungQuickEqualDisabled$ | async)" [disabled]="(preismeldung$ | async)?.isReadonly">
                <div class="pef-inner">
                    <pef-icon name="equal"></pef-icon>
                </div>
            </button>
            <button *ngIf="!(isAdminApp$ | async)" ion-button icon-only class="pef-toolbar-button" (click)="saveButtonClicked$.emit()"
                [class.hidden]="(selectedTab$ | async) != 'PREISMELDUNG'">
                <div class="pef-inner">
                    <pef-icon [name]="(isNotSave$ | async) ? 'arrow_right' : 'save'"></pef-icon>
                </div>
            </button>
        </div>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldungToolbarComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() preismeldung: P.CurrentPreismeldungViewBag;
    @Input() selectedTab: string;
    @Input() isAdminApp: boolean;
    @Input() isNotSave: boolean;
    @Input() disableQuickEqual: boolean;
    @Output('selectTab') selectTab$ = new EventEmitter<string>();
    @Output('buttonClicked') buttonClicked$: Observable<string>;
    otherButtonClicked$ = new EventEmitter<string>();
    saveButtonClicked$ = new EventEmitter();

    private onDestroy$ = new Subject();

    public preismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungViewBag>('preismeldung');
    public isNotSave$ = this.observePropertyCurrentValue<boolean>('isNotSave')
        .publishReplay(1)
        .refCount();
    public selectedTab$ = this.observePropertyCurrentValue<string>('selectedTab')
        .publishReplay(1)
        .refCount();
    public isAdminApp$ = this.observePropertyCurrentValue<boolean>('isAdminApp')
        .publishReplay(1)
        .refCount();
    public disableQuickEqual$ = this.observePropertyCurrentValue<boolean>('disableQuickEqual')
        .startWith(false)
        .publishReplay(1)
        .refCount();
    public hasAttributes$: Observable<boolean>;
    public requestPreismeldungQuickEqualDisabled$: Observable<boolean>;

    constructor() {
        super();

        this.selectedTab$.takeUntil(this.onDestroy$).subscribe();

        this.hasAttributes$ = this.preismeldung$.map(
            p => !!p && !!p.warenkorbPosition.productMerkmale && !!p.warenkorbPosition.productMerkmale.length
        );

        this.requestPreismeldungQuickEqualDisabled$ = this.preismeldung$
            .map(x => !!x && [2, 3, 7].some(y => y === x.preismeldung.bearbeitungscode))
            .combineLatest(this.disableQuickEqual$, (disabledByPm, disabledByInput) => disabledByInput || disabledByPm)
            .startWith(false);

        this.buttonClicked$ = this.otherButtonClicked$.merge(
            this.saveButtonClicked$.withLatestFrom(
                this.isNotSave$,
                (_, isNotSave) => (isNotSave ? 'REQUEST_SELECT_NEXT_PREISMELDUNG' : 'PREISMELDUNG_SAVE')
            )
        );
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.onDestroy$.next();
    }
}
