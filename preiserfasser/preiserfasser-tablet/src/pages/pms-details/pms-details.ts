import { Store } from '@ngrx/store';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

import { range } from 'lodash';

import { Models as P } from 'lik-shared';
import * as fromRoot from '../../reducers';

@Component({
    selector: 'pms-details',
    templateUrl: 'pms-details.html'
})
export class PmsDetailsPage {
    public isDesktop$ = this.store.select(fromRoot.getIsDesktop);
    public pms$ = this.store.select(fromRoot.getCurrentPreismeldestelle);
    public header$ = this.pms$.map(formatHeader);
    public address$ = this.pms$.map(formatAddress);

    public form: FormGroup;

    constructor(private navParams: NavParams, private store: Store<fromRoot.AppState>, private formBuilder: FormBuilder) {
        this.store.select(fromRoot.getPreismeldestellen)
            .filter(x => !!x && x.length > 0).subscribe(() => {
                this.store.dispatch({ type: 'PREISMELDESTELLE_SELECT', payload: navParams.get('pmsNummer') });
            });
        this.pms$.subscribe(x => {
            console.log('xx', JSON.stringify(x, null, 4));
        });

        this.form = formBuilder.group({
            kontaktpersons: formBuilder.array(range(2).map(i => this.initKontaktpersonGroup({ required: i === 0 }))),
            erhebungsart: [{ value: null, disabled: true }],
            erhebungshaeufigkeit: [{ value: null, disabled: true }],
            erhebungsartComment: [{ value: null, disabled: true }],
            additionalInformation: [{ value: null, disabled: true }],
            pmsNummer: [null, Validators.compose([Validators.required, Validators.pattern('[0-9]+')])],
            name: [null],
            regionId: [null],
            languageCode: [null],
            supplement: [null],
            street: [null],
            postcode: [null],
            town: [null],
            active: [true]
        });

        this.pms$
            .filter(x => !!x)
            .distinctUntilKeyChanged('_rev')
            .subscribe((preismeldestelle: P.AdvancedPreismeldestelle) => {
                this.form.markAsUntouched();
                this.form.markAsPristine();
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
                    languageCode: preismeldestelle.languageCode !== null ? preismeldestelle.languageCode : '',
                }, { onlySelf: true, emitEvent: false });
            });
    }

    private initKontaktpersonGroup({ required }) {
        const r = (validator) => required ? validator : null;
        return this.formBuilder.group({
            firstName: [null, r(Validators.compose([Validators.required, Validators.minLength(1)]))],
            surname: [null, r(Validators.compose([Validators.required, Validators.minLength(1)]))],
            personFunction: [null, r(Validators.required)],
            languageCode: [null],
            telephone: [null],
            mobile: [null],
            fax: [null],
            email: [null]
        });
    }

    private getKontaktPersonMapping(kontaktpersons: P.KontaktPerson[]) {
        if (!kontaktpersons || kontaktpersons.length === 0) kontaktpersons = [<any>{ languageCode: '' }, { languageCode: '' }];
        return kontaktpersons.map(x => ({
            firstName: x.firstName,
            surname: x.surname,
            personFunction: x.personFunction,
            languageCode: x.languageCode !== null ? x.languageCode : '',
            telephone: x.telephone,
            mobile: x.mobile,
            fax: x.fax,
            email: x.email
        }));
    }
}

const formatHeader = (pms: P.Preismeldestelle) => !pms ? '' : joinComma(pms.name, joinSpace(pms.postcode, pms.town));
const formatAddress = (pms: P.Preismeldestelle) => !pms ? [] : [pms.name, pms.street, joinSpace(pms.postcode, pms.town)];

const join = (strings: string[], separator: string) => strings.filter(x => !!x).join(separator);

const joinComma = (...strings: string[]) => join(strings, ', ');
const joinSpace = (...strings: string[]) => join(strings, ' ');
