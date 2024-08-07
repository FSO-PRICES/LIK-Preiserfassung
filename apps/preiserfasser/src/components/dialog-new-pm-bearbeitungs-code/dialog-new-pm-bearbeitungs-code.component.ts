/*
 * LIK-Preiserfassung
 * Copyright (C) 2024 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
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
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UnionOf, ofType, unionize } from 'unionize';

import { StronglyTypedDialog } from '@lik-shared';

export type Bearbeitungscode = 2 | 3;

export const DialogNewPmBearbeitungsCodeResult = unionize({
    OK: ofType<{ bearbeitungscode: Bearbeitungscode }>(),
    Cancel: {},
});
export type DialogNewPmBearbeitungsCodeResult = UnionOf<typeof DialogNewPmBearbeitungsCodeResult>;

@Component({
    selector: 'dialog-new-pm-bearbeitungs-code',
    templateUrl: 'dialog-new-pm-bearbeitungs-code.component.html',
    styleUrls: ['./dialog-new-pm-bearbeitungs-code.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'pef-dialog' },
})
export class DialogNewPmBearbeitungsCodeComponent extends StronglyTypedDialog<
    never,
    DialogNewPmBearbeitungsCodeResult
> {
    public bearbeitungscode: Bearbeitungscode = 3;

    public ok() {
        this.closeDialog(DialogNewPmBearbeitungsCodeResult.OK({ bearbeitungscode: this.bearbeitungscode }));
    }

    public cancel() {
        this.closeDialog(DialogNewPmBearbeitungsCodeResult.Cancel());
    }
}
