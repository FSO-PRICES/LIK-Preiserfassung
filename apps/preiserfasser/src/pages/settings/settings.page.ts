import { AfterViewInit, Component, EventEmitter } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import * as E from '@effect/data/Either';
import { pipe } from '@effect/data/Function';
import * as Match from '@effect/match';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
    Observable,
    catchError,
    combineLatest,
    delay,
    distinctUntilChanged,
    filter,
    map,
    merge,
    of,
    shareReplay,
    startWith,
    switchMap,
    take,
} from 'rxjs';

import { OO, PefDialogService } from '@lik-shared';

import { Actions as DatabaseAction } from '../../actions/database';
import { CanDeactivate } from '../../guards/can-deactivate-guard';
import { isValidServerConnectionUrl } from '../../models';
import * as fromRoot from '../../reducers';
import { SettingsActions } from '../../state/settings';

@UntilDestroy()
@Component({
    selector: 'settings-page',
    templateUrl: 'settings.page.html',
    styleUrls: ['settings.page.scss'],
})
export class SettingsPage implements AfterViewInit, CanDeactivate {
    public cancelClicked$ = new EventEmitter<Event>();
    public saveClicked$ = new EventEmitter<Event>();
    public deleteAllClicked$ = new EventEmitter<Event>();
    public databaseIsDeleted$: Observable<boolean>;

    public showValidationHints$: Observable<boolean>;
    public canConnectToDatabase$: Observable<boolean>;
    public currentVersion$: Observable<string | null>;
    public canLeave$: Observable<boolean>;
    public allowToSave$: Observable<boolean>;

    public settings$ = this.store.select(fromRoot.getSettings);
    public preisErfasserVersion$ = this.settings$.pipe(
        map((settings) => settings.version),
        OO.fromFilteredSome,
    );

    public form = this.formBuilder.group({
        url: new FormControl('', Validators.compose([Validators.required, isServerConnectionUrlValidator])),
    });
    private afterViewInit$ = new EventEmitter();

    constructor(
        private router: Router,
        private store: Store<fromRoot.AppState>,
        private pefDialogService: PefDialogService,
        translateService: TranslateService,
        private formBuilder: FormBuilder,
    ) {
        const serverConnectionUrl$ = this.settings$.pipe(map((settings) => settings.serverConnectionUrl));

        serverConnectionUrl$.pipe(untilDestroyed(this)).subscribe((eitherServerConnectionUrl) => {
            this.form.markAsUntouched();
            this.form.markAsPristine();
            const url = E.isRight(eitherServerConnectionUrl)
                ? eitherServerConnectionUrl.right
                : pipe(
                      Match.value(eitherServerConnectionUrl.left),
                      Match.tag('InvalidUrlError', (a) => a.value),
                      Match.orElse(() => ''),
                  );
            this.form.patchValue({ url }, { emitEvent: false });
        });

        this.currentVersion$ = this.afterViewInit$.pipe(
            delay(3000),
            switchMap(() => App.getInfo()),
            map((a) => a.build),
            catchError(() => of(null)),
        );

        this.canConnectToDatabase$ = this.store
            .select((x) => x.database.canConnectToDatabase)
            .pipe(shareReplay({ bufferSize: 1, refCount: true }));

        this.canLeave$ = serverConnectionUrl$.pipe(
            map((a) => E.isRight(a)),
            startWith(false),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        this.allowToSave$ = merge(this.form.valueChanges, serverConnectionUrl$).pipe(
            map(() => !this.form.pristine && this.form.valid),
            startWith(false),
        );

        const canSave$ = this.saveClicked$.pipe(
            map(() => ({ isValid: this.form.valid })),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        const databaseExists$ = this.store
            .select((x) => x.database.databaseExists)
            .pipe(
                distinctUntilChanged(),
                filter((exists) => exists !== null),
                shareReplay({ bufferSize: 1, refCount: true }),
            );

        this.showValidationHints$ = canSave$.pipe(
            distinctUntilChanged(),
            map(() => true),
            startWith(false),
        );

        this.databaseIsDeleted$ = combineLatest([
            this.deleteAllClicked$,
            databaseExists$.pipe(
                filter((exists) => !exists),
                take(1),
            ),
        ]).pipe(map((_, databaseExists) => !databaseExists));

        this.currentVersion$.pipe(untilDestroyed(this)).subscribe();

        this.deleteAllClicked$.pipe(untilDestroyed(this)).subscribe(() => {
            this.store.dispatch({ type: 'DELETE_DATABASE' } as DatabaseAction);
        });

        this.saveClicked$.pipe(untilDestroyed(this)).subscribe(() => {
            this.pefDialogService.displayLoading(translateService.instant('text_saving-settings'), {
                requestDismiss$: serverConnectionUrl$,
            });
            this.store.dispatch(SettingsActions.saveServerConnectionUrl({ serverConnectionUrl: this.form.value.url }));
        });
    }

    public ngAfterViewInit() {
        this.store.dispatch({ type: 'CHECK_CONNECTIVITY_TO_DATABASE' } as DatabaseAction);
        this.afterViewInit$.emit();
    }

    public canDeactivate() {
        return this.canLeave$.pipe(take(1)).toPromise();
    }
}

export function isServerConnectionUrlValidator(control: AbstractControl): ValidationErrors | null {
    const isNotUrl = typeof control.value !== 'string' || !isValidServerConnectionUrl(control.value);
    return isNotUrl ? { isNotUrl: { value: control.value } } : null;
}
