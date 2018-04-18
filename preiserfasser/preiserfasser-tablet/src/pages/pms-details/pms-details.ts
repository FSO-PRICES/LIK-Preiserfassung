import { Store } from '@ngrx/store';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { NavParams, NavController, IonicPage } from 'ionic-angular';
import { Observable, Subscription } from 'rxjs';
import { range, mapValues, values, assign } from 'lodash';

import { Models as P, parseErhebungsarten, encodeErhebungsartFromForm } from 'lik-shared';

import * as fromRoot from '../../reducers';
import { Actions as preismeldestellenAction } from '../../actions/preismeldestellen';

@IonicPage()
@Component({
    selector: 'pms-details',
    templateUrl: 'pms-details.html',
})
export class PmsDetailsPage implements OnDestroy {
    public isDesktop$ = this.store.select(fromRoot.getIsDesktop);
    public pms$ = this.store.select(fromRoot.getCurrentPreismeldestelle);
    public languages$ = this.store.select(fromRoot.getLanguagesList);

    public pmsGeschlossenClicked$ = new EventEmitter();
    public formErrors$: Observable<string[]>;
    public hasErrors$: Observable<boolean>;

    public cancelClicked$ = new EventEmitter<Event>();
    public saveClicked$ = new EventEmitter();
    public showValidationHints$: Observable<boolean>;

    private subscriptions: Subscription[];

    public form: FormGroup;

    constructor(
        private navCtrl: NavController,
        private navParams: NavParams,
        private store: Store<fromRoot.AppState>,
        private formBuilder: FormBuilder
    ) {
        this.form = formBuilder.group(
            {
                kontaktpersons: formBuilder.array(range(2).map(i => this.initKontaktpersonGroup())),
                name: [null, Validators.required],
                supplement: [null],
                street: [null, Validators.required],
                postcode: [null, Validators.required],
                town: [null, Validators.required],
                telephone: [null],
                email: [null],
                internetLink: [null],
                languageCode: [null, Validators.required],
                erhebungsarten: formBuilder.group({
                    tablet: [false],
                    telefon: [false],
                    email: [false],
                    internet: [false],
                    papierlisteVorOrt: [false],
                    papierlisteAbgegeben: [false],
                }),
                pmsGeschlossen: [0],
                erhebungsartComment: [null],
                zusatzInformationen: [null],
                pmsTop: [null],
            },
            { validator: this.formLevelValidationFactory() }
        );

        const distinctPreismeldestelle$ = this.pms$
            .filter(x => !!x)
            .distinctUntilKeyChanged('_rev')
            .publishReplay(1)
            .refCount();

        const canSave$ = this.saveClicked$
            .map(() => ({ isValid: this.form.valid }))
            .publishReplay(1)
            .refCount();

        const save$ = canSave$
            .filter(x => x.isValid)
            .publishReplay(1)
            .refCount();

        this.showValidationHints$ = canSave$
            .distinctUntilChanged()
            .mapTo(true)
            .merge(distinctPreismeldestelle$.mapTo(false))
            .publishReplay(1)
            .refCount();

        this.formErrors$ = this.showValidationHints$.map(showErrors => (showErrors ? this.getFormErrors() : []));
        this.hasErrors$ = this.formErrors$.map(x => !!x && x.length > 0);

        this.subscriptions = [
            distinctPreismeldestelle$.subscribe((preismeldestelle: P.Preismeldestelle) => {
                this.form.markAsUntouched();
                this.form.markAsPristine();
                this.form.patchValue(
                    {
                        kontaktpersons: this.getKontaktPersonMapping(preismeldestelle.kontaktpersons),
                        name: preismeldestelle.name,
                        supplement: preismeldestelle.supplement,
                        street: preismeldestelle.street,
                        postcode: preismeldestelle.postcode,
                        town: preismeldestelle.town,
                        telephone: preismeldestelle.telephone,
                        email: preismeldestelle.email,
                        internetLink: preismeldestelle.internetLink,
                        languageCode: !!preismeldestelle.languageCode ? preismeldestelle.languageCode : '',
                        erhebungsarten: parseErhebungsarten(preismeldestelle.erhebungsart),
                        pmsGeschlossen: preismeldestelle.pmsGeschlossen,
                        erhebungsartComment: preismeldestelle.erhebungsartComment,
                        zusatzInformationen: preismeldestelle.zusatzInformationen,
                        pmsTop: preismeldestelle.pmsTop,
                    },
                    { onlySelf: true, emitEvent: false }
                );
            }),

            this.store
                .select(fromRoot.getPreismeldestellen)
                .filter(x => !!x && x.length > 0)
                .subscribe(() => {
                    this.store.dispatch({ type: 'PREISMELDESTELLE_SELECT', payload: navParams.get('pmsNummer') });
                }),

            this.cancelClicked$.subscribe(() => this.navigateToDashboard()),

            this.form.valueChanges
                .map(() =>
                    assign({}, this.form.value, {
                        erhebungsart: encodeErhebungsartFromForm(this.form.value.erhebungsarten),
                    })
                )
                .subscribe(payload =>
                    store.dispatch({ type: 'UPDATE_CURRENT_PREISMELDESTELLE', payload } as preismeldestellenAction)
                ),

            this.pmsGeschlossenClicked$
                .mapTo(null)
                .merge(distinctPreismeldestelle$)
                .scan((pmsGeschlossen, p) => {
                    if (!!p) return p.pmsGeschlossen;
                    return pmsGeschlossen === this.form.value.pmsGeschlossen ? null : this.form.value.pmsGeschlossen;
                }, 0)
                .filter(pmsGeschlossen => !pmsGeschlossen)
                .subscribe(x => {
                    this.form.patchValue({ pmsGeschlossen: 0 });
                }),

            save$.subscribe(() => store.dispatch({ type: 'SAVE_PREISMELDESTELLE' } as preismeldestellenAction)),
        ];
    }

    public ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }

    public getFormErrors() {
        return Object.keys(this.form.errors || {}).map(errorType => `validation_${errorType}`);
    }

    private initKontaktpersonGroup() {
        return this.formBuilder.group({
            oid: [null],
            firstName: [null],
            surname: [null],
            personFunction: [null],
            telephone: [null],
            mobile: [null],
            fax: [null],
            email: [null],
            languageCode: [null],
        });
    }

    private getKontaktPersonMapping(kontaktpersons: P.KontaktPerson[]) {
        if (!kontaktpersons || kontaktpersons.length === 0)
            kontaktpersons = [<any>{ languageCode: '' }, { languageCode: '' }];
        return kontaktpersons.map(x => ({
            oid: x.oid,
            firstName: x.firstName,
            surname: x.surname,
            personFunction: x.personFunction,
            telephone: x.telephone,
            mobile: x.mobile,
            fax: x.fax,
            email: x.email,
            languageCode: x.languageCode || '',
        }));
    }

    navigateToDashboard() {
        return this.navCtrl.setRoot('DashboardPage');
    }

    formLevelValidationFactory() {
        return (group: FormGroup) => {
            const erhebungsarten = group.get('erhebungsarten') as FormGroup;
            return Object.keys(erhebungsarten.controls).every(k => !erhebungsarten.get(k).value)
                ? { erhebungsart_required: true }
                : null;
        };
    }
}
