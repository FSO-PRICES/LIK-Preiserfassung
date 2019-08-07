import { Component, HostBinding, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular';

import { InputP, PefMessageDialogButton } from '@lik-shared';

@Component({
    selector: 'pef-dialog-confirm-delete',
    templateUrl: 'pef-dialog-confirm-delete.html',
})
export class PefDialogConfirmDeleteComponent {
    @Input() message: InputP<string>;
    @Input() buttons: InputP<PefMessageDialogButton[]>;
    @HostBinding('class') classes = 'pef-dialog';

    constructor(public viewCtrl: PopoverController) {}
}
