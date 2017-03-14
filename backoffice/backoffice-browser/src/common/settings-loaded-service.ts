import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import * as fromRoot from '../reducers';

@Injectable()
export class SettingsLoadedService {
    private settings$ = this.store.select(fromRoot.getSettings);

    constructor(private store: Store<fromRoot.AppState>) {
    }

    areSettingsLoaded() {
        return this.settings$.map(settings => settings !== undefined);
    }
}
