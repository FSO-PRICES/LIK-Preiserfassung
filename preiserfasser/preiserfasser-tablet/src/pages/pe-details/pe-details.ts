import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NavController, IonicPage } from 'ionic-angular';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';

import * as fromRoot from '../../reducers';
import { CurrentPreiserheber } from '../../reducers/preiserheber';

import { Action as PreiserheberAction } from '../../actions/preiserheber';

@IonicPage()
@Component({
    selector: 'preiserheber-page',
    templateUrl: 'pe-details.html'
})
export class PreiserheberPage implements OnDestroy {
    public currentPreiserheber$ = this.store.select(fromRoot.getCurrentPreiserheber).skip(1);
    public languages$ = this.store.select(fromRoot.getLanguagesList).publishReplay(1).refCount();

    public cancelClicked$ = new EventEmitter<Event>();
    public saveClicked$ = new EventEmitter<Event>();

    public showValidationHints$: Observable<boolean>;
    public canLeave$: Observable<boolean>;
    public allowToSave$: Observable<boolean>;

    public form: FormGroup;
    private subscriptions: Subscription[];

    constructor(
        private navCtrl: NavController,
        private store: Store<fromRoot.AppState>,
        private formBuilder: FormBuilder
    ) {
        this.allowToSave$ = this.currentPreiserheber$
            .map(x => !!x && x.isModified && !x.isSaved);

        this.form = formBuilder.group({
            firstName: [null, Validators.compose([Validators.required, Validators.minLength(1)])],
            surname: [null, Validators.compose([Validators.required, Validators.minLength(1)])],
            personFunction: [null],
            telephone: [null],
            mobilephone: [null],
            email: [null],
            fax: [null],
            webseite: [null],
            languageCode: [null, Validators.required],
            street: [null],
            postcode: [null],
            town: [null]
        });

        const update$ = this.form.valueChanges
            .map(() => this.form.value);

        const distinctPreiserheber$ = this.currentPreiserheber$
            .filter(x => !!x)
            .distinctUntilKeyChanged('isModified')
            .publishReplay(1).refCount();

        const canSave$ = this.saveClicked$
            .map(() => ({ isValid: this.form.valid }))
            .publishReplay(1).refCount();

        const save$ = canSave$
            .filter(x => x.isValid)
            .publishReplay(1).refCount();

        this.showValidationHints$ = canSave$
            .distinctUntilChanged()
            .mapTo(true)
            .startWith(false);

        this.subscriptions = [
            this.cancelClicked$.subscribe(() => this.navigateToDashboard()),

            update$.subscribe(x => store.dispatch({ type: 'UPDATE_PREISERHEBER', payload: x } as PreiserheberAction)),

            save$.subscribe(() => store.dispatch({ type: 'SAVE_PREISERHEBER' } as PreiserheberAction)),

            distinctPreiserheber$
                .filter(preiserheber => !!preiserheber)
                .subscribe((erheber: CurrentPreiserheber) => {
                    this.form.markAsUntouched();
                    this.form.markAsPristine();
                    this.form.patchValue({
                        firstName: erheber.firstName,
                        surname: erheber.surname,
                        personFunction: erheber.personFunction,
                        telephone: erheber.telephone,
                        mobilephone: erheber.mobilephone,
                        email: erheber.email,
                        fax: erheber.fax,
                        webseite: erheber.webseite,
                        languageCode: erheber.languageCode !== null ? erheber.languageCode : '',
                        street: erheber.street,
                        postcode: erheber.postcode,
                        town: erheber.town
                    }, { emitEvent: false });
                })
        ];
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'LOAD_PREISERHEBER' } as PreiserheberAction);
    }

    public ngOnDestroy() {
        this.subscriptions.map(s => !s.closed ? s.unsubscribe() : null);
    }

    public navigateToDashboard() {
        return this.navCtrl.setRoot('DashboardPage');
    }
}
