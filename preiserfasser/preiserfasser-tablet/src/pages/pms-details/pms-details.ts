import { Store } from '@ngrx/store';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { NavParams, NavController, IonicPage } from 'ionic-angular';
import { Observable, Subscription } from 'rxjs';
import { range, mapValues, values } from 'lodash';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../../reducers';
import { Actions as preismeldestellenAction } from '../../actions/preismeldestellen';
import { Action as RegionAction } from '../../actions/region';

@IonicPage()
@Component({
    selector: 'pms-details',
    templateUrl: 'pms-details.html'
})
export class PmsDetailsPage implements OnDestroy {
    public isDesktop$ = this.store.select(fromRoot.getIsDesktop);
    public pms$ = this.store.select(fromRoot.getCurrentPreismeldestelle);
    public regionen$ = this.store.select(fromRoot.getRegionen);
    public languages$ = this.store.select(fromRoot.getLanguagesList);

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
        this.form = formBuilder.group({
            kontaktpersons: formBuilder.array(range(2).map(i => this.initKontaktpersonGroup({ required: i === 0 }))),
            name: [null, Validators.required],
            supplement: [null],
            street: [null, Validators.required],
            postcode: [null, Validators.required],
            town: [null, Validators.required],
            telephone: [null],
            email: [null],
            languageCode: [null, Validators.required],
            erhebungsregion: [null, Validators.required],
            erhebungsart: [{ value: null }, Validators.required],
            erhebungshaeufigkeit: [{ value: null }],
            erhebungsartComment: [{ value: null }],
            zusatzInformationen: [null],
        });

        const distinctPreismeldestelle$ = this.pms$
            .filter(x => !!x)
            .distinctUntilKeyChanged('_rev')
            .publishReplay(1).refCount();

        distinctPreismeldestelle$
            .subscribe((preismeldestelle: P.Preismeldestelle) => {
                this.form.markAsUntouched();
                this.form.markAsPristine();
                this.form.patchValue(<P.Preismeldestelle>{
                    kontaktpersons: this.getKontaktPersonMapping(preismeldestelle.kontaktpersons),
                    name: preismeldestelle.name,
                    supplement: preismeldestelle.supplement,
                    street: preismeldestelle.street,
                    postcode: preismeldestelle.postcode,
                    town: preismeldestelle.town,
                    telephone: preismeldestelle.telephone,
                    email: preismeldestelle.email,
                    languageCode: !!preismeldestelle.languageCode ? preismeldestelle.languageCode : '',
                    erhebungsregion: !!preismeldestelle.erhebungsregion ? preismeldestelle.erhebungsregion : '',
                    erhebungsart: preismeldestelle.erhebungsart,
                    erhebungshaeufigkeit: preismeldestelle.erhebungshaeufigkeit,
                    erhebungsartComment: preismeldestelle.erhebungsartComment,
                    zusatzInformationen: preismeldestelle.zusatzInformationen,
                }, { onlySelf: true, emitEvent: false });
            });

        const canSave$ = this.saveClicked$
            .map(() => ({ isValid: this.form.valid }))
            .publishReplay(1).refCount();

        const save$ = canSave$.filter(x => x.isValid)
            .publishReplay(1).refCount();

        this.showValidationHints$ = canSave$.distinctUntilChanged().mapTo(true)
            .merge(distinctPreismeldestelle$.mapTo(false))
            .publishReplay(1).refCount();

        this.formErrors$ = this.showValidationHints$.map(showErrors => showErrors ? this.getFormErrors() : []);
        this.hasErrors$ = this.formErrors$.map(x => !!x && x.length > 0);

        this.subscriptions = [
            this.store.select(fromRoot.getPreismeldestellen)
                .filter(x => !!x && x.length > 0)
                .subscribe(() => {
                    this.store.dispatch({ type: 'PREISMELDESTELLE_SELECT', payload: navParams.get('pmsNummer') });
                }),

            this.cancelClicked$.subscribe(() => this.navigateToDashboard()),

            this.form.valueChanges
                .map(() => this.form.value)
                .subscribe(payload => store.dispatch({ type: 'UPDATE_CURRENT_PREISMELDESTELLE', payload } as preismeldestellenAction)),

            save$.subscribe(() => store.dispatch({ type: 'SAVE_PREISMELDESTELLE' } as preismeldestellenAction))
        ];

        this.store.dispatch({ type: 'REGION_LOAD' } as RegionAction);
    }

    public ngOnDestroy() {
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }

    public getFormErrors() {
        const getErrors = (control, name) => {
            const controls = values(mapValues<{ [key: string]: { name: string, control: {} } }>(control.controls, (value, key) => ({ name: key, control: value })));
            if (controls.length === 0) {
                return !control.errors ? [] : Object.keys(control.errors).map(errorType => `validation_${name}_${errorType}`);
            }
            return controls.reduce((prev, curr) => [...prev, ...getErrors(curr.control, curr.name)], []);
        };
        return getErrors(this.form, 'form');
    }

    private initKontaktpersonGroup({ required }) {
        const r = (validator) => required ? validator : null;
        return this.formBuilder.group({
            firstName: [null, r(Validators.compose([Validators.required, Validators.minLength(1)]))],
            surname: [null, r(Validators.compose([Validators.required, Validators.minLength(1)]))],
            personFunction: [null, r(Validators.required)],
            telephone: [null],
            mobile: [null],
            fax: [null],
            email: [null],
            languageCode: [null]
        });
    }

    private getKontaktPersonMapping(kontaktpersons: P.KontaktPerson[]) {
        if (!kontaktpersons || kontaktpersons.length === 0) kontaktpersons = [<any>{ languageCode: '' }, { languageCode: '' }];
        return kontaktpersons.map(x => ({
            firstName: x.firstName,
            surname: x.surname,
            personFunction: x.personFunction,
            telephone: x.telephone,
            mobile: x.mobile,
            fax: x.fax,
            email: x.email,
            languageCode: x.languageCode !== null ? x.languageCode : ''
        }));
    }

    navigateToDashboard() {
        return this.navCtrl.setRoot('DashboardPage');
    }
}
