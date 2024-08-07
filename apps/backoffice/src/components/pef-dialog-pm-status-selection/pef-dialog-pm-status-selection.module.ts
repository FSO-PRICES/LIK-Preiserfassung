import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { PefComponentsModule } from '@lik-shared';

import { PefDialogPmStatusSelectionComponent } from './pef-dialog-pm-status-selection';

@NgModule({
    imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule, PefComponentsModule],
    declarations: [PefDialogPmStatusSelectionComponent],
    exports: [PefDialogPmStatusSelectionComponent],
})
export class PefDialogPmStatusSelectionModule {}
