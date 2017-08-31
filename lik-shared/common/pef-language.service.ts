import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class PefLanguageService {
    currentLanguage$ = Observable.of('de');
}
