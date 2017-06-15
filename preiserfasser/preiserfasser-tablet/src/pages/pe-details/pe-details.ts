import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NavController, IonicPage } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';

import { PefDialogService } from 'lik-shared';

import * as fromRoot from '../../reducers';
import { CurrentPreiserheber } from '../../reducers/preiserheber';

import { Action as PreiserheberAction } from '../../actions/preiserheber';

@IonicPage()
@Component({
    selector: 'preiserheber-page',
    templateUrl: 'pe-details.html'
})
export class PreiserheberPage implements OnDestroy {
    public currentPreiserheber$ = this.store.select(fromRoot.getCurrentPreiserheber);
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
        private pefDialogService: PefDialogService,
        private translateService: TranslateService,
        private formBuilder: FormBuilder
    ) {
        const loadingText$ = translateService.get('text_saving-preiserheber');

        this.canLeave$ = this.currentPreiserheber$
            .map(x => !!x)
            .startWith(false)
            .publishReplay(1).refCount();

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

        const distinctSetting$ = this.currentPreiserheber$
            .filter(x => !!x)
            .distinctUntilKeyChanged('isModified')
            .publishReplay(1).refCount();

        const canSave$ = this.saveClicked$
            .map(() => ({ isValid: this.form.valid }))
            .publishReplay(1).refCount();

        const save$ = canSave$
            .filter(x => x.isValid)
            .publishReplay(1).refCount()
            .withLatestFrom(this.saveClicked$);

        const preiserheberSaved$ = this.currentPreiserheber$
            .filter(x => x != null && x.isSaved);

        const databaseExists$ = this.store.map(x => x.database)
            .map(x => x.databaseExists)
            .distinctUntilChanged()
            .filter(exists => exists !== null)
            .publishReplay(1).refCount();

        this.showValidationHints$ = canSave$.distinctUntilChanged().mapTo(true)
            .merge(distinctSetting$.mapTo(false));

        this.subscriptions = [
            this.cancelClicked$.subscribe(() => this.navigateToDashboard()),

            update$.subscribe(x => store.dispatch({ type: 'UPDATE_PREISERHEBER', payload: x } as PreiserheberAction)),

            save$
                .withLatestFrom(loadingText$, (_, loadingText) => loadingText)
                .flatMap(loadingText => this.pefDialogService.displayLoading(loadingText, preiserheberSaved$))
                .subscribe(() => {
                    store.dispatch({ type: 'SAVE_PREISERHEBER' } as PreiserheberAction);
                }),

            distinctSetting$
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

    public ionViewCanLeave() {
        return this.canLeave$.take(1).toPromise();
    }

    public ngOnDestroy() {
        this.subscriptions.map(s => !s.closed ? s.unsubscribe() : null);
    }

    public navigateToDashboard() {
        return this.navCtrl.setRoot('DashboardPage');
    }
}
