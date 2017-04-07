import { Component } from '@angular/core';
import { ViewController, NavController } from 'ionic-angular';

import { SettingsPage } from '../settings/settings';

// TODO: integrate method with other dialogs / modals
@Component({
    selector: 'login-modal',
    templateUrl: 'login.html'
})
export class LoginModal {
    public username: string;
    public password: string;

    constructor(public viewCtrl: ViewController, public navController: NavController) { }

    login() {
        this.viewCtrl.dismiss({ username: this.username, password: this.password, navigateTo: null });
    }

    navigateToSettings() {
        this.viewCtrl.dismiss({ username: null, password: null, navigateTo: SettingsPage });
    }
}
