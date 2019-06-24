import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
    selector: 'login-modal',
    templateUrl: 'login-modal.component.html',
})
export class LoginModalComponent {
    public username: string;
    public password: string;

    constructor(private modalController: ModalController) {}

    login() {
        this.modalController.dismiss({ username: this.username, password: this.password, navigateTo: null });
    }

    navigateToSettings() {
        this.modalController.dismiss({ username: null, password: null, navigateTo: 'SettingsPage' });
    }
}
