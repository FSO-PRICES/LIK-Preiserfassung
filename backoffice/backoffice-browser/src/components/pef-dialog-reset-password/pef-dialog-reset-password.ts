import { Component, HostBinding, EventEmitter, OnDestroy } from '@angular/core';
import { ViewController } from 'ionic-angular';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';

import * as fromRoot from '../../reducers';
import { Subscription } from 'rxjs';

@Component({
    selector: 'pef-dialog-reset-password',
    templateUrl: 'pef-dialog-reset-password.html',
})
export class PefDialogResetPasswordComponent implements OnDestroy {
    @HostBinding('class') classes = 'pef-dialog';

    public form: FormGroup;

    public resetPasswordClicked$ = new EventEmitter();
    public pesetPasswordError$ = this.store.select(fromRoot.getResetPasswordError).publishReplay(1).refCount();

    private subscriptions: Subscription[] = [];

    constructor(public viewCtrl: ViewController, private formBuilder: FormBuilder, private store: Store<fromRoot.AppState>) {
        this.form = formBuilder.group({
            password: [null, Validators.compose([Validators.required, Validators.maxLength(35)])]
        });

        const ResetPasswordSuccess$ = this.store.select(fromRoot.getCurrentPreiserheber)
            .map(erheber => erheber.isPasswordResetted)
            .filter(x => !!x);

        this.subscriptions = [
            this.resetPasswordClicked$
                .map(x => ({ isValid: this.form.valid, password: this.form.get('password').value }))
                .filter(x => x.isValid)
                .subscribe(x => {
                    store.dispatch({ type: 'RESET_PASSWORD', payload: x.password });
                }),

            ResetPasswordSuccess$
                .subscribe(success => viewCtrl.dismiss('RESETTED'))
        ];
    }

    ngOnDestroy() {
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }
}
