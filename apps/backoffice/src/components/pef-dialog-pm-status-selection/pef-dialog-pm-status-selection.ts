import { Component, HostBinding, Input, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';

import { InputP } from '@lik-shared';

import * as P from '../../common-models';

@Component({
    selector: 'pef-dialog-pm-status-selection',
    templateUrl: 'pef-dialog-pm-status-selection.html',
    styleUrls: ['./pef-dialog-pm-status-selection.scss'],
})
export class PefDialogPmStatusSelectionComponent implements OnInit {
    @Input() hasMarker: InputP<boolean>;
    @HostBinding('class') classes = 'pef-dialog';

    public toMarker = false;

    public pmStatus: P.Models.PreismeldungStatus = null;

    constructor(public viewCtrl: PopoverController) {}

    ngOnInit() {
        this.toMarker = this.hasMarker;
    }
}
