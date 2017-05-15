import { Store } from '@ngrx/store';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { NavParams, NavController } from 'ionic-angular';
import { Observable, Subscription } from 'rxjs';
import { range, mapValues, values } from 'lodash';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../../reducers';
import { DashboardPage } from '../dashboard/dashboard';
import { Actions as preismeldestellenAction } from '../../actions/preismeldestellen';

@Component({
    selector: 'pms-details',
    templateUrl: 'pms-details.html'
})
export class PmsDetailsPage implements OnDestroy {
    public isDesktop$ = this.store.select(fromRoot.getIsDesktop);
    public pms$ = this.store.select(fromRoot.getCurrentPreismeldestelle);
    public header$ = this.pms$.map(formatHeader);
    public address$ = this.pms$.map(formatAddress);

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
        this.store.select(fromRoot.getPreismeldestellen)
            .filter(x => !!x && x.length > 0).subscribe(() => {
                this.store.dispatch({ type: 'PREISMELDESTELLE_SELECT', payload: navParams.get('pmsNummer') });
            });

        this.form = formBuilder.group({
            kontaktpersons: formBuilder.array(range(2).map(i => this.initKontaktpersonGroup({ required: i === 0 }))),
            erhebungsart: [{ value: null, disabled: true }],
            erhebungshaeufigkeit: [{ value: null, disabled: true }],
            erhebungsartComment: [{ value: null, disabled: true }],
            additionalInformation: [{ value: null, disabled: true }],
        });

        const distinctPreismeldestelle$ = this.pms$
            .filter(x => !!x)
            .distinctUntilKeyChanged('_rev')
            .publishReplay(1).refCount();

        distinctPreismeldestelle$
            .subscribe((preismeldestelle: P.AdvancedPreismeldestelle) => {
                this.form.markAsUntouched();
                this.form.markAsPristine();
                this.form.patchValue(<P.AdvancedPreismeldestelle>{
                    kontaktpersons: this.getKontaktPersonMapping(preismeldestelle.kontaktpersons),
                    erhebungsart: preismeldestelle.erhebungsart,
                    erhebungshaeufigkeit: preismeldestelle.erhebungshaeufigkeit,
                    erhebungsartComment: preismeldestelle.erhebungsartComment,
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
            this.cancelClicked$.subscribe(() => this.navigateToDashboard()),

            this.form.valueChanges
                .map(() => this.form.value)
                .subscribe(payload => store.dispatch({ type: 'UPDATE_CURRENT_PREISMELDESTELLE', payload } as preismeldestellenAction)),

            save$.subscribe(() => store.dispatch({ type: 'SAVE_PREISMELDESTELLE' } as preismeldestellenAction))
        ];
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

    navigateToDashboard() {
        return this.navCtrl.setRoot(DashboardPage, {}, { animate: true, direction: 'back' });
    }
}

const formatHeader = (pms: P.Preismeldestelle) => !pms ? '' : joinComma(pms.name, joinSpace(pms.postcode, pms.town));
const formatAddress = (pms: P.Preismeldestelle) => !pms ? [] : [pms.name, pms.street, joinSpace(pms.postcode, pms.town)];

const join = (strings: string[], separator: string) => strings.filter(x => !!x).join(separator);

const joinComma = (...strings: string[]) => join(strings, ', ');
const joinSpace = (...strings: string[]) => join(strings, ' ');
