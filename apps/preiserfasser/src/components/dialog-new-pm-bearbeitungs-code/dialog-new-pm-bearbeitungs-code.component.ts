import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
    selector: 'dialog-new-pm-bearbeitungs-code',
    templateUrl: 'dialog-new-pm-bearbeitungs-code.component.html',
    styleUrls: ['./dialog-new-pm-bearbeitungs-code.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogNewPmBearbeitungsCodeComponent {
    @HostBinding('class') classes = 'pef-dialog';
    public bearbeitungscode = 3;

    constructor(public popoverCtrl: PopoverController) {}
}
