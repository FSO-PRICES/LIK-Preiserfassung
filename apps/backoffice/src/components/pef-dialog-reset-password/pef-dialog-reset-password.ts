import { Component, EventEmitter, HostBinding, inject } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { filter, map, publishReplay, refCount } from 'rxjs/operators';

import { StronglyTypedDialog } from '@lik-shared';

import * as fromRoot from '../../reducers';

@UntilDestroy()
@Component({
    selector: 'pef-dialog-reset-password',
    templateUrl: 'pef-dialog-reset-password.html',
    styleUrls: ['pef-dialog-reset-password.scss'],
})
export class PefDialogResetPasswordComponent extends StronglyTypedDialog<never, 'RESETTED' | 'ABORT_RESET'> {
    @HostBinding('class') classes = 'pef-dialog';

    private formBuilder = inject(UntypedFormBuilder);
    private store = inject<Store<fromRoot.AppState>>(Store);
    public form = this.formBuilder.group({
        password: [null, Validators.compose([Validators.required, Validators.maxLength(35)])],
    });

    public resetPasswordClicked$ = new EventEmitter();
    public resetPasswordError$ = this.store.select(fromRoot.getResetPasswordError).pipe(publishReplay(1), refCount());

    constructor() {
        super();

        const resetPasswordSuccess$ = this.store.select(fromRoot.getCurrentPreiserheber).pipe(
            map((erheber) => erheber.isPasswordResetted),
            filter((x) => !!x),
        );

        this.resetPasswordClicked$
            .pipe(
                map(() => ({ isValid: this.form.valid, password: this.form.get('password').value })),
                filter((x) => x.isValid),
                untilDestroyed(this),
            )
            .subscribe((x) => {
                this.store.dispatch({ type: 'RESET_PASSWORD', payload: x.password });
            });

        resetPasswordSuccess$.pipe(untilDestroyed(this)).subscribe(() => this.closeDialog('RESETTED'));
    }
}
