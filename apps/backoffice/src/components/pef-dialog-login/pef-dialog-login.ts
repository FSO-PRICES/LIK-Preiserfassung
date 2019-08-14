import { Component, EventEmitter, HostBinding, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PopoverController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { filter, map, publishReplay, refCount } from 'rxjs/operators';

import * as fromRoot from '../../reducers';

@Component({
    selector: 'pef-dialog-login',
    templateUrl: 'pef-dialog-login.html',
    styleUrls: ['pef-dialog-login.scss'],
})
export class PefDialogLoginComponent implements OnDestroy {
    @HostBinding('class') classes = 'pef-dialog';

    public form: FormGroup;

    public login$ = new EventEmitter();
    public loginError$ = this.store.select(fromRoot.getLoginError).pipe(
        publishReplay(1),
        refCount(),
    );

    private subscriptions: Subscription[] = [];

    constructor(formBuilder: FormBuilder, public viewCtrl: PopoverController, private store: Store<fromRoot.AppState>) {
        this.form = formBuilder.group({
            username: [null, Validators.required],
            password: [null, Validators.required],
        });

        const loginSuccess$ = this.store.select(fromRoot.getIsLoggedIn).pipe(filter(x => !!x));

        this.subscriptions = [
            this.login$
                .pipe(
                    map(() => ({ isValid: this.form.valid, credentials: this.form.value })),
                    filter(x => x.isValid),
                )
                .subscribe(x => {
                    store.dispatch({ type: 'LOGIN', payload: x.credentials });
                }),

            loginSuccess$.subscribe(() => viewCtrl.dismiss('LOGGED_IN')),
        ];
    }

    ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }

    navigateToSettings() {
        this.viewCtrl.dismiss('NAVIGATE_TO_SETTINGS');
    }
}
