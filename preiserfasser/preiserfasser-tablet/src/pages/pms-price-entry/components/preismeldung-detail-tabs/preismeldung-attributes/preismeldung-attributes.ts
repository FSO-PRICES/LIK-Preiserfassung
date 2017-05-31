import { Component, Input, OnChanges, SimpleChange, EventEmitter, Output, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { ReactiveComponent } from 'lik-shared';

import * as P from '../../../../../common-models';
import { keys, assign } from 'lodash';
import { Observable } from 'rxjs';

@Component({
    selector: 'preismeldung-attributes',
    templateUrl: 'preismeldung-attributes.html'
})
export class PreismeldungAttributesComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() preismeldung: P.Models.Preismeldung;
    @Input() priceCountStatus: P.PriceCountStatus;
    @Input() preismeldestelle: P.Models.Preismeldestelle;

    @Output('preismeldungAttributesPayload') preismeldungAttributesPayload$: Observable<string[]>;

    public fieldEdited$ = new EventEmitter();

    public preismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungBag>('preismeldung');
    public priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');
    public preismeldestelle$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle');

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
                        .reduce((agg, v) => assign(agg, { [`attribute_${v}`]: bag.attributes[v] }), {});
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
