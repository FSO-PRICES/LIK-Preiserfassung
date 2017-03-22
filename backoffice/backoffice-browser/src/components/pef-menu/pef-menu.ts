import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { NavController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';

import * as fromRoot from '../../reducers';
import { PreiserheberPage } from '../../pages/preiserheber/preiserheber';
import { PreismeldestellePage } from '../../pages/preismeldestelle/preismeldestelle';
import { PreismeldungPage } from '../../pages/preismeldung/preismeldung';
import { RegionPage } from '../../pages/region/region';
import { ImportPage } from '../../pages/import/import';
import { ExportToPrestaPage } from '../../pages/export-to-presta/export-to-presta';
import { SettingsPage } from '../../pages/settings/settings';

@Component({
    selector: 'header[pef-menu]',
    templateUrl: 'pef-menu.html'
})
export class PefMenuComponent {
    public pages = [
        { page: PreiserheberPage, name: 'Preiserheber' },
        { page: PreismeldestellePage, name: 'Preismeldestellen' },
        { page: PreismeldungPage, name: 'Preismeldungen' },
        { page: RegionPage, name: 'Regionen' },
        { page: ImportPage, name: 'Import' },
        { page: ExportToPrestaPage, name: 'Export' }
    ];

    public settingsPage = SettingsPage;

    public dangerZone$: Observable<boolean>;

    constructor(private store: Store<fromRoot.AppState>, private navCtrl: NavController) {
        this.store.dispatch({ type: 'SETTING_LOAD' });

        this.dangerZone$ = store.select(fromRoot.getSettings)
            .filter(setting => !!setting && !!setting.serverConnection && !!setting.serverConnection.url)
            .map(setting => setting.serverConnection.url.indexOf('bfs-lik.lambda-it.ch') !== -1)
            .startWith(false);
    }

    navigateToPage(page) {
        this.navCtrl.setRoot(page, {}, { animate: false }).catch(error => {
            if (error === false) return; // If the error is just a "false" it is that the page cannot be left
            throw(error);
        });
    }
}
