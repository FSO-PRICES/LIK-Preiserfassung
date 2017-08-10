import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';

import { PefDialogService } from 'lik-shared';

import * as importer from '../../actions/importer';
import * as fromRoot from '../../reducers';
import { IonicPage } from 'ionic-angular';

@IonicPage({
    segment: 'controlling'
})
@Component({
    selector: 'controlling-page',
    templateUrl: 'controlling.html'
})
export class ControllingPage {
    constructor(private store: Store<fromRoot.AppState>) {
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
        this.store.dispatch({ type: 'RUN_PRE-CONTROLLING_TASKS' });
    }
}
