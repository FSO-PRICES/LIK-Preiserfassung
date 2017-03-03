import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import * as _ from 'lodash';

import { ReactiveComponent, Models as P } from 'lik-shared';
import { delayedFormValueChanges } from '../../../../common/angular-form-extensions';
import { CurrentPreismeldestelle } from '../../../../reducers/preismeldestelle';


@Component({
    selector: 'preismeldestelle-detail',
    templateUrl: 'preismeldestelle-detail.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreismeldestelleDetailComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldestelle: P.AdvancedPreismeldestelle;
    @Output('save')
    public save$: Observable<{ isValid: boolean }>;
    @Output('clear')
    public clearClicked$ = new EventEmitter<Event>();
    @Output('update')
    public update$: Observable<P.AdvancedPreismeldestelle>;

    public preismeldestelle$: Observable<P.AdvancedPreismeldestelle>;
    public saveClicked$ = new EventEmitter<Event>();

    public isEditing$: Observable<boolean>;

    public form: FormGroup;

    constructor(private formBuilder: FormBuilder) {
        super();

        this.preismeldestelle$ = this.observePropertyCurrentValue<P.AdvancedPreismeldestelle>('preismeldestelle');

        this.form = formBuilder.group({
            kontaktpersons: formBuilder.array(_.range(2).map(i => this.initKontaktpersonGroup({ required: i === 0 }))),
            erhebungsart: [null],
            erhebungshaeufigkeit: [null],
            erhebungsartComment: [null],
            pmsNummer: [null, Validators.compose([Validators.required, Validators.pattern('[0-9]+')])],
            name: [null],
            regionId: [null],
            languageCode: [null],
            supplement: [null, Validators.required],
            street: [null],
            postcode: [null],
            town: [null],
            active: [true]
        });

        this.update$ = delayedFormValueChanges(this.form)
            .map(() => this.form.value)
            .do(x => console.log('updated:', x));

        const distinctPreiserheber$ = this.preismeldestelle$
            .filter(x => !!x);

        distinctPreiserheber$.startWith((<P.AdvancedPreismeldestelle>{}))
            .subscribe((preismeldestelle: CurrentPreismeldestelle) => {
                if (!preismeldestelle.isModified) {
                    this.form.markAsUntouched();
                    this.form.markAsPristine();
                }
                this.form.patchValue(<P.AdvancedPreismeldestelle>{
                    kontaktpersons: this.getKontaktPersonMapping(preismeldestelle.kontaktpersons),
                    regionId: preismeldestelle.regionId,
                    erhebungsart: preismeldestelle.erhebungsart,
                    erhebungshaeufigkeit: preismeldestelle.erhebungshaeufigkeit,
                    erhebungsartComment: preismeldestelle.erhebungsartComment,
                    pmsNummer: preismeldestelle.pmsNummer,
                    name: preismeldestelle.name,
                    supplement: preismeldestelle.supplement,
                    street: preismeldestelle.street,
                    postcode: preismeldestelle.postcode,
                    town: preismeldestelle.town,
                    telephone: preismeldestelle.town,
                    email: preismeldestelle.email,
                    languageCode: preismeldestelle.languageCode,
                }, { onlySelf: true, emitEvent: false });
            });

        this.save$ = this.saveClicked$
            .map(() => ({ isValid: this.form.valid }))
            .filter(x => x.isValid)
            .publishReplay(1).refCount();

        this.isEditing$ = this.preismeldestelle$
            .map((x: CurrentPreismeldestelle) => !!x && (!!x.isModified || !!x._id))
            .publishReplay(1).refCount();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    public isFormValidAndNotPristine() {
        return this.isEditing$.map(editing => {
            return this.form.valid && !this.form.pristine;
        });
    }

    private initKontaktpersonGroup({ required }) {
        const r = (validator) => required ? validator : null;
        return this.formBuilder.group({
            firstName: [null, r(Validators.compose([Validators.required, Validators.minLength(1)]))],
            surname: [null, r(Validators.compose([Validators.required, Validators.minLength(1)]))],
            personFunction: [null, r(Validators.required)],
            languageCode: ['de', r(Validators.required)],
            telephone: [null],
            mobile: [null],
            fax: [null],
            email: [null]
        });
    }

    private getKontaktPersonMapping(kontaktpersons: P.KontaktPerson[]) {
        if (!kontaktpersons || kontaktpersons.length === 0) kontaktpersons = [<any>{}, {}];
        return kontaktpersons.map(x => ({
            firstName: x.firstName,
            surname: x.surname,
            personFunction: x.personFunction,
            languageCode: x.languageCode,
            telephone: x.telephone,
            mobile: x.mobile,
            fax: x.fax,
            email: x.email
        }));
    }
}
