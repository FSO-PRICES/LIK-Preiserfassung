import { Component, HostBinding } from '@angular/core';
import { PopoverController } from '@ionic/angular';

import * as P from '../../common-models';

@Component({
    selector: 'pef-dialog-pm-status-selection',
    templateUrl: 'pef-dialog-pm-status-selection.html',
    styleUrls: ['./pef-dialog-pm-status-selection.scss'],
})
export class PefDialogPmStatusSelectionComponent {
    @HostBinding('class') classes = 'pef-dialog';

    public pmStatus: P.Models.PreismeldungStatus;

    constructor(public viewCtrl: PopoverController) {}
}
