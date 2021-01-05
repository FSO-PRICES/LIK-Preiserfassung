/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

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
