import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Loading, LoadingController, IonicPage } from 'ionic-angular';
import { Observable, Subscription } from 'rxjs';
import { head } from 'lodash';

import { PefDialogService, PefMessageDialogService } from 'lik-shared';
import { DatabaseBackup } from 'lik-shared/common/models';

import * as setting from '../../actions/setting';
import * as fromRoot from '../../reducers';
import { CurrentSetting } from '../../reducers/setting';
import { environment } from '../../environments/environment';

@IonicPage({
    segment: 'settings',
})
@Component({
    templateUrl: 'settings.html',
})
export class SettingsPage implements OnDestroy {
    public currentSettings$ = this.store.select(fromRoot.getCurrentSettings);
    public isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);
    public canConnectToDatabase$ = this.store.select(fromRoot.getCanConnectToDatabase);

    public cancelClicked$ = new EventEmitter<Event>();
    public saveClicked$ = new EventEmitter<Event>();
    public dangerConfirmedClicked$ = new EventEmitter<Event>();
    public exportDbs$ = new EventEmitter<Event>();
    public importFileSelected$ = new EventEmitter<Event>();

    public showValidationHints$: Observable<boolean>;
    public dangerConfirmed$: Observable<boolean>;
    public resetInput$: Observable<{}>;
    public dbsExported$ = this.store.select(fromRoot.getHasExportedDatabases);
    public dbImported$ = this.store.select(fromRoot.getHasImportedDatabase);

    public form: FormGroup;
    private subscriptions: Subscription[] = [];
    private loader: Loading;

    public version = environment.version;

    constructor(
        private store: Store<fromRoot.AppState>,
        private loadingCtrl: LoadingController,
        private formBuilder: FormBuilder,
        private dialogService: PefDialogService,
        pefMessageDialogService: PefMessageDialogService
    ) {
        this.form = formBuilder.group({
            _id: [null],
            serverConnection: formBuilder.group({
                url: [null, Validators.required],
            }),
            general: formBuilder.group({
                erhebungsorgannummer: null,
            }),
            transportRequestSettings: formBuilder.group({
                senderId: null,
                recipientId: null,
            }),
            export: formBuilder.group({
                targetPath: null,
            }),
        });

        const update$ = this.form.valueChanges.map(() => this.form.value);

        const distinctSetting$ = this.currentSettings$
            .filter(x => !!x)
            .distinctUntilKeyChanged('isModified')
            .publishReplay(1)
            .refCount();

        const canSave$ = this.saveClicked$
            .asObservable()
            .map(x => ({ isValid: this.form.valid }))
            .publishReplay(1)
            .refCount();

        const save$ = canSave$
            .filter(x => x.isValid)
            .publishReplay(1)
            .refCount()
            .withLatestFrom(this.saveClicked$);

        this.showValidationHints$ = canSave$
            .distinctUntilChanged()
            .mapTo(true)
            .merge(distinctSetting$.mapTo(false));

        const dangerConfirmedClicked$ = this.dangerConfirmedClicked$
            .asObservable()
            .publishReplay(1)
            .refCount();

        this.dangerConfirmed$ = dangerConfirmedClicked$
            .combineLatest(this.isLoggedIn$.filter(x => !!x))
            .mapTo(true)
            .startWith(false);

        const settingsSaved$ = Observable.defer(() =>
            this.currentSettings$.skip(1).filter(pe => pe != null && pe.isSaved)
        );
        const dismissExportingLoading$ = Observable.defer(() => this.dbsExported$.skip(1));

        const onImport$ = this.importFileSelected$
            .asObservable()
            .switchMap((e: any) => parseInputFile(head(e.target.files as FileList)))
            .switchMap(backup =>
                pefMessageDialogService
                    .displayDialogYesNoMessage(
                        `Wollen Sie wirklich die Datenbank '${backup.db}' mit ${
                            backup.data.total_rows
                        } Einträgen importieren?`
                    )
                    .map(answer => ({ answer, backup }))
            )
            .publishReplay(1)
            .refCount();
        this.resetInput$ = Observable.merge(this.dbImported$, onImport$)
            .map(() => ({ value: '' }))
            .publishReplay(1)
            .refCount();

        this.subscriptions = [
            this.cancelClicked$.subscribe(() => store.dispatch({ type: 'SETTING_LOAD' } as setting.Action)),

            update$.subscribe(x => store.dispatch({ type: 'UPDATE_SETTING', payload: x } as setting.Action)),

            save$.subscribe(() => {
                this.presentLoadingScreen(settingsSaved$);
                store.dispatch({ type: 'SAVE_SETTING' } as setting.Action);
            }),
            dangerConfirmedClicked$.subscribe(() => {
                store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
            }),
            this.exportDbs$.subscribe(() => {
                this.presentLoadingScreen(dismissExportingLoading$);
                store.dispatch({ type: 'EXPORT_DATABASES' } as setting.Action);
            }),
            onImport$
                .filter(({ answer }) => answer.data === 'YES')
                .subscribe(({ backup }) =>
                    this.store.dispatch({ type: 'IMPORT_DATABASE', payload: backup } as setting.Action)
                ),

            settingsSaved$.subscribe(() => {
                store.dispatch({ type: 'CHECK_CONNECTIVITY_TO_DATABASE' });
            }),

            distinctSetting$.subscribe((settings: CurrentSetting) => {
                this.form.markAsUntouched();
                this.form.markAsPristine();
                this.form.patchValue(
                    {
                        _id: settings._id,
                        serverConnection: settings.serverConnection,
                        general: settings.general || {},
                        transportRequestSettings: settings.transportRequestSettings || {},
                        export: settings.export || {},
                    },
                    { emitEvent: false }
                );
            }),
        ];
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'SETTING_LOAD' });
    }

    public ionViewCanLeave(): Promise<boolean> {
        return this.currentSettings$
            .map(settings => !!settings && !settings.isDefault)
            .take(1)
            .toPromise();
    }

    public ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }

    private presentLoadingScreen(dismiss$: Observable<any>) {
        this.dialogService.displayLoading('Datensynchronisierung. Bitte warten...', dismiss$);
    }
}

async function parseInputFile(file: File): Promise<DatabaseBackup> {
    return JSON.parse(await readFile(file));
}

async function readFile(file: File) {
    let reader = new FileReader();
    const cleanupReader = () => {
        reader.onload = null;
        reader.onerror = null;
        reader = null;
    };
    return new Promise<string>((resolve, reject) => {
        reader.readAsText(file, 'UTF-8');
        reader.onload = (evt: any) => {
            resolve(evt.target.result as string);
        };
        reader.onerror = () => {
            reject('Die Datei konnte nicht eingelesen werden.');
        };
    })
        .then(content => {
            cleanupReader();
            return content;
        })
        .catch(error => {
            cleanupReader();
            throw error;
        });
}
