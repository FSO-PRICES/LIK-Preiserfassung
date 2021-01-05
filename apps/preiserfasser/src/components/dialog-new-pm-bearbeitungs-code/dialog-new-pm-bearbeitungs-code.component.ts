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
