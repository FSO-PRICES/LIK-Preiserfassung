import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { Store } from '@ngrx/store';
import { flatten, times, constant } from 'lodash';

import * as P from '../../common-models';

import * as fromRoot from '../../reducers';

@Component({
    selector: 'test-page',
    templateUrl: 'test-page.html'
})
export class TestPage {
    public preismeldestellen$ = this.store.select(fromRoot.getPreismeldestellen)
        .map(x => flatten(x.map(y => times(100, constant(y)))));

    constructor(private navParams: NavParams, private store: Store<fromRoot.AppState>) {
        this.store.dispatch({ type: 'PREISMELDESTELLEN_LOAD_ALL' });
    }
}
