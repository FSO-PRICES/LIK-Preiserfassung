import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from 'ng2-translate';
import { Store } from '@ngrx/store';
import { NavController } from 'ionic-angular';
import { Observable, Subscription } from 'rxjs';

import { PefDialogService } from 'lik-shared';

import * as fromRoot from '../../reducers';
import { CurrentSetting } from '../../reducers/setting';
import { DashboardPage } from '../dashboard/dashboard';

import { Actions as DatabaseAction } from '../../actions/database';
import { Action as SettingsAction } from '../../actions/setting';

@Component({
    selector: 'settings-page',
    templateUrl: 'settings.html'
})
export class SettingsPage implements OnDestroy {
    public cancelClicked$ = new EventEmitter<Event>();
    public saveClicked$ = new EventEmitter<Event>();
    public deleteAllClicked$ = new EventEmitter<Event>();
    public databaseIsDeleted$: Observable<boolean>;

    public showValidationHints$: Observable<boolean>;
    public canConnectToDatabase$: Observable<boolean>;
    public currentSettings$: Observable<CurrentSetting>;
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
        this.currentSettings$ = store.select(fromRoot.getCurrentSettings);

        this.canConnectToDatabase$ = this.store.map(x => x.database.canConnectToDatabase)
            .publishReplay(1).refCount();

        const loadingText$ = translateService.get('text_saving-settings');

        this.canLeave$ = this.currentSettings$
            .map(x => !!x && !x.isDefault)
            .startWith(false)
            .publishReplay(1).refCount();

        this.allowToSave$ = this.currentSettings$
            .map(x => !!x && x.isModified && !x.isSaved);

        this.form = formBuilder.group({
            _id: [null],
            serverConnection: formBuilder.group({
                url: [null, Validators.required],
            })
        });

        const update$ = this.form.valueChanges
            .map(() => this.form.value);

        const distinctSetting$ = this.currentSettings$
            .filter(x => !!x && !x.isDefault)
            .distinctUntilKeyChanged('isModified')
            .publishReplay(1).refCount();

        const canSave$ = this.saveClicked$
            .map(() => ({ isValid: this.form.valid }))
            .publishReplay(1).refCount();

        const save$ = canSave$
            .filter(x => x.isValid)
            .publishReplay(1).refCount()
            .withLatestFrom(this.saveClicked$);

        const settingsSaved$ = this.currentSettings$
            .filter(x => x != null && x.isSaved);

        const databaseExists$ = this.store.map(x => x.database)
            .map(x => x.databaseExists)
            .distinctUntilChanged()
            .filter(exists => exists !== null)
            .publishReplay(1).refCount();

        this.showValidationHints$ = canSave$.distinctUntilChanged().mapTo(true)
            .merge(distinctSetting$.mapTo(false));

        this.databaseIsDeleted$ = this.deleteAllClicked$
            .combineLatest(databaseExists$.filter(exists => !exists).take(1), (_, databaseExists) => databaseExists)
            .map(databaseExists => !databaseExists);

        this.subscriptions = [
            this.cancelClicked$.subscribe(() => this.navCtrl.setRoot(DashboardPage)),

            this.deleteAllClicked$.subscribe(() => {
                this.store.dispatch({ type: 'DELETE_DATABASE' } as DatabaseAction);
            }),

            update$.subscribe(x => store.dispatch({ type: 'UPDATE_SETTINGS', payload: x } as SettingsAction)),

            save$
                .withLatestFrom(loadingText$, (_, loadingText) => loadingText)
                .flatMap(loadingText => this.pefDialogService.displayLoading(loadingText, settingsSaved$))
                .subscribe(() => {
                    store.dispatch({ type: 'SAVE_SETTINGS' } as SettingsAction);
                }),

            settingsSaved$
                .subscribe(() => {
                    this.store.dispatch({ type: 'CHECK_CONNECTIVITY_TO_DATABASE' } as DatabaseAction);
                }),

            distinctSetting$
                .filter(settings => !!settings.serverConnection)
                .subscribe((settings: CurrentSetting) => {
                    this.form.markAsUntouched();
                    this.form.markAsPristine();
                    this.form.patchValue({
                        _id: settings._id,
                        serverConnection: settings.serverConnection
                    }, { emitEvent: false });
                })
        ];
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'CHECK_CONNECTIVITY_TO_DATABASE' } as DatabaseAction);
    }

    public ionViewCanLeave() {
        return this.canLeave$.take(1).toPromise();
    }

    public ngOnDestroy() {
        if (!this.subscriptions || this.subscriptions.length === 0) return;
        this.subscriptions.map(s => !s.closed ? s.unsubscribe() : null);
    }
}
