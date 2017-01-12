import { Component, EventEmitter } from '@angular/core';
import { ViewController } from 'ionic-angular';

@Component({
    selector: 'dialog-cancel-edit',
    templateUrl: 'dialog-cancel-edit.html',
    host: { '[class.pef-dialog]': 'true' }
})
export class DialogCancelEditComponent {
    constructor(public viewCtrl: ViewController) { }
}
