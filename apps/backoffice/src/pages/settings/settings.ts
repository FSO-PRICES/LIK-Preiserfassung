import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { head } from 'lodash';
import { merge as mergeFollowing, Observable, Subscription } from 'rxjs';
import {
    combineLatest,
    distinctUntilChanged,
    distinctUntilKeyChanged,
    filter,
    map,
    mapTo,
    merge,
    publishReplay,
    refCount,
    startWith,
    switchMap,
    withLatestFrom,
    tap,
} from 'rxjs/operators';
import * as semver from 'semver';

import { Models as P, PefDialogService, PefMessageDialogService } from '@lik-shared';

import * as onoffline from '../../actions/onoffline';
import * as setting from '../../actions/setting';
import { environment } from '../../environments/environment';
import * as fromRoot from '../../reducers';
import { CurrentSetting } from '../../reducers/setting';

@Component({
    templateUrl: 'settings.html',
    styleUrls: ['settings.scss'],
})
export class SettingsPage implements OnDestroy {
    public currentSettings$ = this.store.select(fromRoot.getCurrentSettings);
    public isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);
    public canConnectToDatabase$ = this.store.select(fromRoot.getCanConnectToDatabase);
    public minVersion$ = this.store.select(fromRoot.getMinVersion);
    public sedexSettings$ = this.store.select(fromRoot.getSedexSettings);

    public cancelClicked$ = new EventEmitter<Event>();
    public cancelSedexClicked$ = new EventEmitter<Event>();
    public cancelCompatibilityClicked$ = new EventEmitter<Event>();
    public saveClicked$ = new EventEmitter<Event>();
    public saveSedexClicked$ = new EventEmitter<Event>();
    public saveCompatibilityClicked$ = new EventEmitter<Event>();
    public dangerConfirmedClicked$ = new EventEmitter<Event>();
    public exportDbs$ = new EventEmitter<Event>();
    public importFileSelected$ = new EventEmitter<Event>();

    public showValidationHints$: Observable<boolean>;
    public showCompatibilityValidationHints$: Observable<boolean>;
    public settingsSaved$: Observable<CurrentSetting>;
    public dangerConfirmed$: Observable<boolean>;
    public resetInput$: Observable<{}>;
    public dbsExported$ = this.store.select(fromRoot.getHasExportedDatabases).pipe(
        filter(exported => !!exported),
        map(exported =>
            Object.keys(exported)
                .map(db => `${exported[db].data.total_rows} Einträge von '${db}' wurden exportiert`)
                .join('\n'),
        ),
    );
    public dbsImported$ = this.store.select(fromRoot.getHasImportedDatabases).pipe(
        filter(imported => !!imported),
        map(imported =>
            Object.keys(imported)
                .map(db => `${imported[db]} Einträge wurden in '${db}' importiert`)
                .join('\n'),
        ),
    );
    public isModified$ = this.currentSettings$.pipe(map(x => !!x && x.isModified));

    public form: FormGroup;
    public sedexForm$: Observable<FormGroup>;
    public compatibilityForm$: Observable<FormGroup>;
    private subscriptions: Subscription[] = [];

    public version = environment.version;

    constructor(
        formBuilder: FormBuilder,
        private store: Store<fromRoot.AppState>,
        private dialogService: PefDialogService,
        pefMessageDialogService: PefMessageDialogService,
    ) {
        this.form = formBuilder.group({
            _id: [null],
            serverConnection: formBuilder.group({
                url: [null, Validators.required],
            }),
            general: formBuilder.group({
                erhebungsorgannummer: null,
            }),
        });

        this.compatibilityForm$ = this.minVersion$.pipe(
            merge(
                this.cancelCompatibilityClicked$.pipe(withLatestFrom(this.minVersion$, (_, minVersion) => minVersion)),
            ),
            map(minVersion => formBuilder.group({ minVersion: [minVersion, semverValidator()] })),
            publishReplay(1),
            refCount(),
        );
        this.sedexForm$ = this.sedexSettings$.pipe(
            tap(x => console.log('form 1?', x)),
            merge(this.cancelSedexClicked$.pipe(withLatestFrom(this.sedexSettings$, (_, sedex) => sedex))),
            tap(x => console.log('form 2?', x)),
            map(sedex =>
                formBuilder.group({
                    transportRequestSettings: formBuilder.group({
                        senderId: sedex.transportRequestSettings.senderId,
                        recipientId: sedex.transportRequestSettings.recipientId,
                    }),
                    export: formBuilder.group({
                        targetPath: sedex.export.targetPath,
                    }),
                }),
            ),
            tap(x => console.log('form 3?', x)),
        );

        const update$ = this.form.valueChanges.pipe(map(() => this.form.value));

        const distinctSetting$ = this.currentSettings$.pipe(
            filter(x => !!x),
            distinctUntilKeyChanged('isModified'),
            publishReplay(1),
            refCount(),
        );

        const canSave$ = this.saveClicked$.pipe(
            map(x => ({ isValid: this.form.valid })),
            publishReplay(1),
            refCount(),
        );

        const save$ = canSave$.pipe(
            filter(x => x.isValid),
            publishReplay(1),
            refCount(),
        );

        this.showValidationHints$ = canSave$.pipe(
            distinctUntilChanged(),
            mapTo(true),
            merge(distinctSetting$.pipe(mapTo(false))),
        );

        const canSaveCompatibility$ = this.saveCompatibilityClicked$.pipe(
            withLatestFrom(this.compatibilityForm$),
            map(([, compatibilityForm]) => ({ isValid: compatibilityForm.valid })),
            publishReplay(1),
            refCount(),
        );

        const saveCompatibility$ = canSaveCompatibility$.pipe(
            filter(x => x.isValid),
            withLatestFrom(this.compatibilityForm$, (_, form) => form.get('minVersion').value as string),
            publishReplay(1),
            refCount(),
        );

        this.showCompatibilityValidationHints$ = canSaveCompatibility$.pipe(
            distinctUntilChanged(),
            mapTo(true),
            merge(distinctSetting$.pipe(mapTo(false))),
        );

        this.settingsSaved$ = this.currentSettings$.pipe(
            filter(pe => pe != null && pe.isSaved),
            publishReplay(1),
            refCount(),
        );

        const dangerConfirmedClicked$ = this.dangerConfirmedClicked$.pipe(
            publishReplay(1),
            refCount(),
        );

        this.dangerConfirmed$ = dangerConfirmedClicked$.pipe(
            combineLatest(this.isLoggedIn$.pipe(filter(x => !!x))),
            mapTo(true),
            startWith(false),
        );

        const onImport$ = this.importFileSelected$.pipe(
            switchMap((e: any) => parseInputFile(head(e.target.files))),
            switchMap(backup =>
                pefMessageDialogService
                    .displayDialogYesNoMessage(
                        'Wollen Sie wirklich die folgenden Datenbanken importieren?\n' +
                            Object.keys(backup)
                                .map(db => `'${db}' (${backup[db].data.total_rows} Einträge)`)
                                .join(', '),
                    )
                    .pipe(map(answer => ({ answer, backup }))),
            ),
            publishReplay(1),
            refCount(),
        );
        this.resetInput$ = mergeFollowing(this.dbsImported$, onImport$).pipe(
            map(() => ({ value: '' })),
            publishReplay(1),
            refCount(),
        );

        this.subscriptions = [
            this.cancelClicked$.subscribe(() => store.dispatch({ type: 'SETTING_LOAD' } as setting.Action)),

            update$.subscribe(x => store.dispatch({ type: 'UPDATE_SETTING', payload: x } as setting.Action)),

            save$.subscribe(() => {
                this.presentLoadingScreen(this.settingsSaved$);
                store.dispatch({ type: 'SAVE_SETTING' } as setting.Action);
            }),
            saveCompatibility$.subscribe(payload => {
                this.presentLoadingScreen(this.minVersion$);
                store.dispatch({ type: 'SAVE_MIN_VERSION', payload } as onoffline.Action);
            }),
            dangerConfirmedClicked$.subscribe(() => {
                store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
            }),
            this.exportDbs$.subscribe(() => {
                this.presentLoadingScreen(this.dbsExported$);
                store.dispatch({ type: 'EXPORT_DATABASES' } as setting.Action);
            }),
            onImport$
                .pipe(filter(({ answer }) => answer.data === 'YES'))
                .subscribe(({ backup }) =>
                    this.store.dispatch({ type: 'IMPORT_DATABASE', payload: backup } as setting.Action),
                ),

            this.settingsSaved$.subscribe(() => {
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
                    },
                    { emitEvent: false },
                );
            }),
        ];
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'SETTING_LOAD' });
    }

    public ionViewCanLeave(): Promise<boolean> {
        return this.currentSettings$.pipe(map(settings => !!settings && !settings.isDefault)).toPromise();
    }

    public ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }

    private presentLoadingScreen(dismiss$: Observable<any>) {
        this.dialogService.displayLoading('Datensynchronisierung. Bitte warten...', {
            requestDismiss$: dismiss$,
        });
    }
}

async function parseInputFile(file: File): Promise<P.DatabaseBackupResult> {
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

function semverValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null =>
        semver.valid(control.value) === null ? { semver: { value: control.value } } : null;
}
