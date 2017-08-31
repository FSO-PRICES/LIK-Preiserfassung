import { Component } from '@angular/core';
import { ViewController, NavParams, IonicPage } from 'ionic-angular';

use from lik-shared

@IonicPage()
@Component({
    selector: 'dialog-validation-errors',
    templateUrl: 'dialog-validation-errors.html',
    host: { '[class.pef-dialog]': 'true' }
})
export class DialogValidationErrorsComponent {
    constructor(public viewCtrl: ViewController, public navParams: NavParams) { }
}
