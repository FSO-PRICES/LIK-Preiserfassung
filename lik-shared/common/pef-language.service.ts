
import {of as observableOf,  Observable } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable()
export class PefLanguageService {
    public currentLanguage$ = observableOf('de');
}
