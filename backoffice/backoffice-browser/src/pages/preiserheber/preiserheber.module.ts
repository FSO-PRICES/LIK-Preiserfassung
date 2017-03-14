import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';

import { PreiserheberPage } from './preiserheber';
import { PreiserheberDetailComponent } from './components/preiserheber-detail/preiserheber-detail';
import { PreiserheberListComponent } from './components/preiserheber-list/preiserheber-list';
import { PreiserheberPreiszuweisungComponent } from './components/preiserheber-preiszuweisung/preiserheber-preiszuweisung';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PefDialogCancelEditModule } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit.module';
import { PefComponentsModule } from 'lik-shared';

@NgModule({
    imports: [CommonModule, IonicModule, PefComponentsModule, PefMenuModule, PefDialogCancelEditModule],
    declarations: [
        PreiserheberPage,
        PreiserheberDetailComponent,
        PreiserheberListComponent,
        PreiserheberPreiszuweisungComponent
    ],
    entryComponents: [
        PreiserheberDetailComponent,
        PreiserheberListComponent,
        PreiserheberPreiszuweisungComponent
    ],
    exports: [PreiserheberPage, PreiserheberDetailComponent, PreiserheberListComponent, PreiserheberPreiszuweisungComponent]
})
export class PreiserheberModule {
}
