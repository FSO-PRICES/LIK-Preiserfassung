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
import { filter, map, shareReplay, withLatestFrom, publishReplay, refCount } from 'rxjs/operators';

import { ReactiveComponent } from '../../../../common/ReactiveComponent';

import * as P from '../../../models';

@Component({
    selector: 'preismeldung-attributes',
    styleUrls: ['./preismeldung-attributes.scss'],
    templateUrl: 'preismeldung-attributes.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldungAttributesComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() preismeldung: P.CurrentPreismeldungViewBag;
    @Input() priceCountStatus: P.PriceCountStatus;
    @Input() preismeldestelle: P.Models.Preismeldestelle;
    @Input() isDesktop: boolean;
    @Input() isAdminApp: boolean;

    @Output('preismeldungAttributesPayload') preismeldungAttributesPayload$: Observable<string[]>;

    public fieldEdited$ = new EventEmitter();
    public isReadonly$: Observable<boolean>;

    public preismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungViewBag>('preismeldung');
    public priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');
    public preismeldestelle$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle');
    public isDesktop$ = this.observePropertyCurrentValue<P.WarenkorbInfo[]>('isDesktop');
    public isAdminApp$ = this.observePropertyCurrentValue<P.WarenkorbInfo[]>('isAdminApp');
    public produktMerkmale$: Observable<{ attribute: P.Models.PropertyTranslation; initial: string }[]>;

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

        const preismeldung$ = this.preismeldung$.pipe(
            filter(bag => !!bag),
            shareReplay({ bufferSize: 1, refCount: true }),
        );
        this.subscriptions.push(
            preismeldung$.subscribe(bag => {
                const formDef = keys(bag.warenkorbPosition.productMerkmale).reduce(
                    (agg, v) => assign(agg, { [`attribute_${v}`]: !!bag.attributes ? bag.attributes[v] : null }),
                    {},
                );
                this.form.reset(formDef);
            }),
        );
        this.produktMerkmale$ = preismeldung$.pipe(
            map(bag => {
                return bag.warenkorbPosition.productMerkmale.map((attribute, i) => ({
                    attribute,
                    initial: initialMerkmal(bag, i, this.form.value[`attribute_${i}`]),
                }));
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

        this.isReadonly$ = preismeldung$.pipe(
            map(x => x.isReadonly),
            publishReplay(1),
            refCount(),
        );
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }
}

const initialMerkmal = (bag: P.CurrentPreismeldungBag, index: number, formValue: string) => {
    if (!bag.refPreismeldung) {
        return null;
    }
    return bag.refPreismeldung.productMerkmale[index] !== formValue ? bag.refPreismeldung.productMerkmale[index] : null;
};
