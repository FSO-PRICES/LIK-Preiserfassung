import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PefLanguageService } from 'lik-shared';

@Injectable()
export class PreiserfasserTabletPefLanguageService implements PefLanguageService {
    public currentLanguage$ = Observable.of('de');
}
