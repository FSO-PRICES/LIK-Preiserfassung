import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';

import { PreiserheberPage } from './preiserheber';
import { PreiserheberDetailComponent } from './components/preiserheber-detail/preiserheber-detail';
import { PreiserheberListComponent } from './components/preiserheber-list/preiserheber-list';

@NgModule({
    imports: [CommonModule, IonicModule],
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
