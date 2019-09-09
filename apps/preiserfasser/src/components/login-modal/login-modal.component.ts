import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ModalController } from '@ionic/angular';

@Component({
    selector: 'login-modal',
    templateUrl: 'login-modal.component.html',
    styleUrls: ['login-modal.component.scss'],
})
export class LoginModalComponent {
    public loginForm: FormGroup;

    @ViewChild('username', { read: ElementRef, static: false }) username: ElementRef<HTMLElement>;

    constructor(private modalController: ModalController, private formBuilder: FormBuilder) {
        this.loginForm = this.formBuilder.group({
            username: [''],
            password: [''],
        });
    }

    ionViewDidEnter() {
        const el = this.username.nativeElement.querySelector('input') as HTMLElement;
        if (el && el.focus) {
            el.focus();
        }
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
