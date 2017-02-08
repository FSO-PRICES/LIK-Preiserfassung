import { Component, EventEmitter } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { Store } from '@ngrx/store';

import * as P from '../../common-models';

import * as fromRoot from '../../reducers';

@Component({
    selector: 'test-page',
    templateUrl: 'test-page.html'
})
export class TestPage {
    public preismeldestellen$ = this.store.select(fromRoot.getPreismeldestellen);

    constructor(private navParams: NavParams, private store: Store<fromRoot.AppState>) {
    }
}
