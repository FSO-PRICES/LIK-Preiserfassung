import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';

import { PreiserheberPage } from './preiserheber';
import { PreiserheberDetailComponent } from './components/preiserheber-detail/preiserheber-detail';
import { PreiserheberListComponent } from './components/preiserheber-list/preiserheber-list';
import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';

import { PefComponentsModule } from 'lik-shared';

@NgModule({
    imports: [CommonModule, IonicModule, PefMenuModule, PefComponentsModule],
    declarations: [
        PreiserheberPage,
        PreiserheberDetailComponent,
        PreiserheberListComponent
    ],
    entryComponents: [
        PreiserheberDetailComponent,
        PreiserheberListComponent
    ],
    exports: [PreiserheberPage, PreiserheberDetailComponent, PreiserheberListComponent]
})
export class PreiserheberModule {
}
