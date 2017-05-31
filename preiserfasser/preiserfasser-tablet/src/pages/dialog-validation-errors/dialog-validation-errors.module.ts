import { NgModule } from '@angular/core';
import { DialogValidationErrorsComponent } from './dialog-validation-errors';
import { IonicPageModule } from 'ionic-angular';
import { PefComponentsModule } from 'lik-shared';

@NgModule({
    declarations: [DialogValidationErrorsComponent],
    imports: [
        IonicPageModule.forChild(DialogValidationErrorsComponent),
        PefComponentsModule
    ],
})
export class DialogValidationErrorsModule { }
