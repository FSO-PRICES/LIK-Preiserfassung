import { Component, HostBinding, OnInit } from '@angular/core';
import { UnionOf, ofType, unionize } from 'unionize';

import { StronglyTypedDialog } from '@lik-shared';

import * as P from '../../common-models';

export const DialogPmStatusSelectionResult = unionize({
    CONFIRM_SAVE: ofType<{ toMarker: boolean; pmStatus: P.Models.PreismeldungStatus }>(),
    ABORT_SAVE: {},
});
export type DialogPmStatusSelectionResult = UnionOf<typeof DialogPmStatusSelectionResult>;

@Component({
    selector: 'pef-dialog-pm-status-selection',
    templateUrl: 'pef-dialog-pm-status-selection.html',
    styleUrls: ['./pef-dialog-pm-status-selection.scss'],
})
export class PefDialogPmStatusSelectionComponent
    extends StronglyTypedDialog<{ hasMarker: boolean }, DialogPmStatusSelectionResult>
    implements OnInit
{
    @HostBinding('class') classes = 'pef-dialog';

    public toMarker = false;
    public pmStatus: P.Models.PreismeldungStatus | null = null;

    ngOnInit() {
        this.toMarker = this.data.hasMarker;
    }

    save() {
        if (this.pmStatus !== null) {
            this.closeDialog(
                DialogPmStatusSelectionResult.CONFIRM_SAVE({ toMarker: this.toMarker, pmStatus: this.pmStatus }),
            );
        }
    }

    cancel() {
        this.closeDialog(DialogPmStatusSelectionResult.ABORT_SAVE());
    }
}
