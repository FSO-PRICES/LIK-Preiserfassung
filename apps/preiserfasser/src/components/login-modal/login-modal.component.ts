import { AfterViewInit, Component, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import * as O from '@effect/data/Option';
import { IonInput } from '@ionic/angular';

import { StronglyTypedDialog } from '@lik-shared';

export type LoginModalResult = O.Option<{ username: string; password: string }>;

@Component({
    selector: 'login-modal',
    templateUrl: 'login-modal.component.html',
    styleUrls: ['login-modal.component.scss'],
    host: { class: 'pef-dialog' },
})
export class LoginModalComponent extends StronglyTypedDialog<never, LoginModalResult> implements AfterViewInit {
    private formBuilder = inject(FormBuilder);
    public loginForm = this.formBuilder.group({
        username: new FormControl('', [Validators.required]),
        password: new FormControl('', [Validators.required]),
    });

    @ViewChild('username') username: IonInput;

    ngAfterViewInit() {
        this.username.getInputElement().then((el) => {
            el.focus();
        });
    }

    login() {
        this.closeDialog(
            O.some({
                username: this.loginForm.getRawValue().username,
                password: this.loginForm.getRawValue().password,
            }),
        );
    }

    navigateToSettings() {
        this.closeDialog(O.none());
    }
}
