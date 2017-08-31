import { Component, HostBinding } from '@angular/core';
import { ViewController, NavParams, IonicPage } from 'ionic-angular';

@IonicPage()
@Component({
    selector: 'dialog-validation-errors',
    templateUrl: 'dialog-validation-errors.html'
})
export class DialogValidationErrorsComponent {
    @HostBinding('class') classes = 'pef-dialog';
    constructor(public viewCtrl: ViewController, public navParams: NavParams) { }
}
