import { Component, HostBinding } from '@angular/core';
import { ViewController } from 'ionic-angular';

@Component({
    selector: 'dialog-cancel-edit',
    templateUrl: 'dialog-cancel-edit.html'
})
export class DialogCancelEditComponent {
    @HostBinding('class') classes = 'pef-dialog';

    constructor(public viewCtrl: ViewController) { }
}
