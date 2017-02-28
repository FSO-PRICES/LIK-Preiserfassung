import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';

// TODO: integrate method with other dialogs / modals
@Component({
    selector: 'login-modal',
    templateUrl: 'login.html'
})
export class LoginModal {
    public username: string;
    public password: string;

    constructor(public viewCtrl: ViewController) { }

    login() {
        this.viewCtrl.dismiss({ username: this.username, password: this.password });
    }
}
