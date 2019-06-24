import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';

import { PefLanguageService } from 'lik-shared';


import * as fromRoot from '../reducers';

@Injectable()
export class PreiserfasserTabletPefLanguageService implements PefLanguageService {
    public currentLanguage$ = this.store.select(fromRoot.getCurrentLanguage);

    constructor(private store: Store<fromRoot.AppState>) { }
}
