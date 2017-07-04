import { Component, HostBinding, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { ViewController } from 'ionic-angular';
import { Subscription } from 'rxjs';

import * as fromRoot from '../../reducers';

@Component({
    selector: 'pef-dialog-login',
    templateUrl: 'pef-dialog-login.html',
})
export class PefDialogLoginComponent implements OnDestroy {
    @HostBinding('class') classes = 'pef-dialog';

    public form: FormGroup;

    public loginClicked$ = new EventEmitter();
    public loginError$ = this.store.select(fromRoot.getLoginError).publishReplay(1).refCount();

    private subscriptions: Subscription[] = [];

    constructor(public viewCtrl: ViewController, private formBuilder: FormBuilder, private store: Store<fromRoot.AppState>) {
        this.form = formBuilder.group({
            username: [null, Validators.required],
            password: [null, Validators.required]
        });

        const loginSuccess$ = this.store.select(fromRoot.getIsLoggedIn)
            .filter(x => !!x);

        this.subscriptions = [
            this.loginClicked$
                .map(x => ({ isValid: this.form.valid, credentials: this.form.value }))
                .filter(x => x.isValid)
                .subscribe(x => {
                    store.dispatch({ type: 'LOGIN', payload: x.credentials });
                }),

            loginSuccess$
                .subscribe(success => viewCtrl.dismiss('LOGGED_IN'))
        ];
    }

    ngOnDestroy() {
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }

    navigateToSettings() {
        this.viewCtrl.dismiss('NAVIGATE_TO_SETTINGS');
    }
}
