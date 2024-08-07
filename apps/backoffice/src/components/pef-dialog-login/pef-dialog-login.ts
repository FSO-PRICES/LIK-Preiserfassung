import { DialogRef } from '@angular/cdk/dialog';
import { AfterViewInit, Component, ElementRef, EventEmitter, HostBinding, OnDestroy, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { IonInput } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, publishReplay, refCount } from 'rxjs/operators';

import * as fromRoot from '../../reducers';

export type PefDialogLoginResult = 'LOGGED_IN' | 'NAVIGATE_TO_SETTINGS';
@Component({
    selector: 'pef-dialog-login',
    templateUrl: 'pef-dialog-login.html',
    styleUrls: ['pef-dialog-login.scss'],
})
export class PefDialogLoginComponent implements OnDestroy, AfterViewInit {
    @HostBinding('class') classes = 'pef-dialog';

    @ViewChild('username') username: IonInput;

    public form: UntypedFormGroup;

    public login$ = new EventEmitter();
    public loginError$ = this.store.select(fromRoot.getLoginError).pipe(publishReplay(1), refCount());

    public showValidationHints$: Observable<boolean>;

    private subscriptions: Subscription[] = [];

    constructor(
        formBuilder: UntypedFormBuilder,
        private dialogRef: DialogRef<PefDialogLoginResult>,
        private store: Store<fromRoot.AppState>,
    ) {
        this.form = formBuilder.group({
            username: [null, Validators.required],
            password: [null, Validators.required],
        });

        const loginSuccess$ = this.store.select(fromRoot.getIsLoggedIn).pipe(filter((x) => !!x));

        this.subscriptions = [
            this.login$
                .pipe(
                    map(() => ({ isValid: this.form.valid, credentials: this.form.value })),
                    filter((x) => x.isValid),
                )
                .subscribe((x) => {
                    store.dispatch({ type: 'LOGIN', payload: x.credentials });
                }),

            loginSuccess$.subscribe(() => this.dialogRef.close('LOGGED_IN')),
        ];
        this.showValidationHints$ = this.login$.pipe(
            distinctUntilChanged(),
            map(() => true),
        );
    }

    ngAfterViewInit() {
        this.username.getInputElement().then((el) => {
            el.focus();
        });
    }

    ngOnDestroy() {
        this.subscriptions.filter((s) => !!s && !s.closed).forEach((s) => s.unsubscribe());
    }

    navigateToSettings() {
        this.dialogRef.close('NAVIGATE_TO_SETTINGS');
    }
}
