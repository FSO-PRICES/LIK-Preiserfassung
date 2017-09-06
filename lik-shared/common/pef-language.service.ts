import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class PefLanguageService {
    public currentLanguage$ = Observable.of('de');
}
