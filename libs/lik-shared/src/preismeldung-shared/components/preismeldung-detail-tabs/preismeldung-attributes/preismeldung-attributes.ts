import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChange,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { assign, keys } from 'lodash';
import { Observable } from 'rxjs';
import { filter, withLatestFrom } from 'rxjs/operators';

import { ReactiveComponent } from '../../../../common/ReactiveComponent';

import * as P from '../../../models';

@Component({
    selector: 'preismeldung-attributes',
    styleUrls: ['./preismeldung-attributes.scss'],
    template: `
        <preismeldung-readonly-header
            [preismeldung]="preismeldung$ | async"
            [preismeldestelle]="preismeldestelle$ | async"
            [isAdminApp]="isAdminApp$ | async"
        ></preismeldung-readonly-header>

        <div class="detail-tab-bottom-part" pef-perfect-scrollbar [enabled]="isDesktop$ | async">
            <form [formGroup]="form">
                <div class="detail-tab-bottom-part">
                    <h3 class="large">{{ 'heading_preismeldung-attributes' | translate }}</h3>
                    <ion-list>
                        <ion-item
                            class="pef-item"
                            *ngFor="
                                let att of (preismeldung$ | async)?.warenkorbPosition.productMerkmale;
                                let i = index
                            "
                        >
                            <ion-label>{{ att | pefPropertyTranslate }}</ion-label>
                            <ion-input
                                type="text"
                                [formControlName]="'attribute_' + i"
                                (ionBlur)="fieldEdited$.emit()"
                            ></ion-input>
                        </ion-item>
                    </ion-list>
                </div>
            </form>
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
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
            attribute_9: [''],
        });

        this.subscriptions.push(
            this.preismeldung$.pipe(filter(bag => !!bag)).subscribe(bag => {
                const formDef = keys(bag.warenkorbPosition.productMerkmale).reduce(
                    (agg, v) => assign(agg, { [`attribute_${v}`]: !!bag.attributes ? bag.attributes[v] : null }),
                    {},
                );
                this.form.reset(formDef);
            }),
        );

        this.preismeldungAttributesPayload$ = this.fieldEdited$.pipe(
            withLatestFrom(this.preismeldung$, (_, bag) => {
                const productMerkmale = bag.warenkorbPosition.productMerkmale.map(
                    (x, i) => this.form.value[`attribute_${i}`],
                );
                const isSame = productMerkmale.every((v, i) => bag.attributes[i] === v);
                return isSame ? null : productMerkmale;
            }),
            filter(x => !!x),
        );
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }
}
