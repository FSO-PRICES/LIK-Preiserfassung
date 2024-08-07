import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { NgxLetModule, PefComponentsModule, PreismeldungSharedModule } from '@lik-shared';

import { PefDialogCancelEditModule } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit.module';
import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PefPmStatusModule } from '../../components/pef-pm-status/pef-pm-status.module';

import { PefTypeaheadComponent } from './components/pef-typeahead/pef-typeahead';
import { PreismeldungListComponent } from './components/preismeldung-list/preismeldung-list';
import { PreismeldungPage } from './preismeldung';

@NgModule({
    declarations: [PreismeldungPage, PreismeldungListComponent, PefTypeaheadComponent],
    exports: [
        PreismeldungListComponent,
        PefComponentsModule,
        PefDialogCancelEditModule,
        PefMenuModule,
        PreismeldungSharedModule,
        PefTypeaheadComponent,
        PefPmStatusModule,
    ],
    imports: [
        CommonModule,
        IonicModule,
        FormsModule,
        NgxLetModule,
        TranslateModule,
        ReactiveFormsModule,
        PefComponentsModule,
        PefDialogCancelEditModule,
        PefMenuModule,
        PreismeldungSharedModule,
        PefPmStatusModule,
        ScrollingModule,
    ],
})
export class PreismeldungModule {}
