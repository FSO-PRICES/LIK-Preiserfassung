import { Component, HostBinding } from '@angular/core';
import { ViewController } from 'ionic-angular';

@Component({
    selector: 'pef-dialog-confirm-delete',
    templateUrl: 'pef-dialog-confirm-delete.html',
})
export class PefDialogConfirmDeleteComponent {
    @HostBinding('class') classes = 'pef-dialog';
    public text: string;

    constructor(public viewCtrl: ViewController) {
        this.text = viewCtrl.data.params.text;
    }
}
