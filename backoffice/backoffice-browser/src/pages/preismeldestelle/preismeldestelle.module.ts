import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PreismeldestellePage } from './preismeldestelle';
import { PreismeldestelleDetailComponent } from './components/preismeldestelle-detail/preismeldestelle-detail';
import { PreismeldestelleListComponent } from './components/preismeldestelle-list/preismeldestelle-list';
import { AdvancedSettingsComponent } from './components/advanced-settings/advanced-settings';

@NgModule({
    imports: [CommonModule, IonicModule, PefMenuModule],
    declarations: [
        PreismeldestellePage,
        AdvancedSettingsComponent,
        PreismeldestelleDetailComponent,
        PreismeldestelleListComponent
    ],
    entryComponents: [
        AdvancedSettingsComponent,
        PreismeldestelleDetailComponent,
        PreismeldestelleListComponent
    ],
    exports: [PreismeldestellePage, AdvancedSettingsComponent, PreismeldestelleDetailComponent, PreismeldestelleListComponent]
})
export class PreismeldestelleModule {
}
