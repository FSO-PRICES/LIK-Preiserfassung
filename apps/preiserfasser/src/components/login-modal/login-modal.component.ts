import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ModalController } from '@ionic/angular';

@Component({
    selector: 'login-modal',
    templateUrl: 'login-modal.component.html',
    styleUrls: ['login-modal.component.scss'],
})
export class LoginModalComponent {
    public loginForm: FormGroup;

    constructor(private modalController: ModalController, private formBuilder: FormBuilder) {
        this.loginForm = this.formBuilder.group({
            username: [''],
            password: [''],
        });
    }

    login() {
        this.modalController.dismiss({
            username: this.loginForm.value.username,
            password: this.loginForm.value.password,
            navigateTo: null,
        });
    }

    navigateToSettings() {
        this.modalController.dismiss({ username: null, password: null, navigateTo: 'settings' });
    }
}
