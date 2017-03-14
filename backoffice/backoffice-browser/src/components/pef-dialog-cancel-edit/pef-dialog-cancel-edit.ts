import { Component, HostBinding } from '@angular/core';
import { ViewController } from 'ionic-angular';

@Component({
    selector: 'pef-dialog-cancel-edit',
    templateUrl: 'pef-dialog-cancel-edit.html',
})
export class PefDialogCancelEditComponent {
    constructor(public viewCtrl: ViewController) { }
    @HostBinding('class') classes = 'pef-dialog';
}
