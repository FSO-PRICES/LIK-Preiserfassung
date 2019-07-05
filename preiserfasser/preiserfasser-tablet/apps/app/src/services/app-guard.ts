import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';

import { areSettingsValid } from '../common/settings';
import * as fromRoot from '../reducers';

@Injectable({
    providedIn: 'root',
})
export class AppGuard implements CanActivate {
    constructor(private store: Store<fromRoot.AppState>, private navCtrl: NavController) {}

    canActivate() {
        return this.store.select(fromRoot.getSettings).pipe(
            take(1),
            map(settings => {
                if (!areSettingsValid(settings)) {
                    this.navCtrl.navigateRoot(['/settings']);
                    return false;
                }
                return true;
            }),
        );
    }
}
