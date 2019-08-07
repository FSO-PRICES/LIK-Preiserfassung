import { Component, HostBinding } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
    selector: 'pef-dialog-cancel-edit',
    templateUrl: 'pef-dialog-cancel-edit.html',
})
export class PefDialogCancelEditComponent {
    constructor(public viewCtrl: PopoverController) {}
    @HostBinding('class') classes = 'pef-dialog';
}
