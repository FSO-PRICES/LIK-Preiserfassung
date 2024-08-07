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
