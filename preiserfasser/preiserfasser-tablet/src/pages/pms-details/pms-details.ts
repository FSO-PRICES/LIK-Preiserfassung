import { Store } from '@ngrx/store';
import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

import * as P  from '../../common-models';
import * as fromRoot from '../../reducers';

@Component({
    selector: 'pms-details',
    templateUrl: 'pms-details.html'
})
export class PmsDetailsPage {
    isDesktop$ = this.store.select(fromRoot.getIsDesktop);
    pms$ = this.store.select(fromRoot.getCurrentPreismeldestelle);
    header$ = this.pms$.map(formatHeader);
    address$ = this.pms$.map(formatAddress);

    constructor(private navParams: NavParams, private store: Store<fromRoot.AppState>) {
        this.store.dispatch({ type: 'PREISMELDESTELLE_SELECT', payload: navParams.get('pmsKey') });
        this.pms$.subscribe(x => {
            console.log('xx', JSON.stringify(x, null, 4));
        });
    }
}

const formatHeader = (pms: P.Models.Preismeldestelle) => !pms ? '' : joinComma(pms.name, joinSpace(pms.postcode, pms.town));
const formatAddress = (pms: P.Models.Preismeldestelle) => !pms ? [] : [pms.name, pms.street, joinSpace(pms.postcode, pms.town)];

const join = (strings: string[], separator: string) => strings.filter(x => !!x).join(separator);

const joinComma = (...strings: string[]) => join(strings, ', ');
const joinSpace = (...strings: string[]) => join(strings, ' ');
