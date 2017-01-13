import { Component, EventEmitter } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';

@Component({
    selector: 'dialog-validation-errors',
    templateUrl: 'dialog-validation-errors.html',
    host: { '[class.pef-dialog]': 'true' }
})
export class DialogValidationErrorsComponent {
    constructor(public viewCtrl: ViewController, public navParams: NavParams) { }
}
