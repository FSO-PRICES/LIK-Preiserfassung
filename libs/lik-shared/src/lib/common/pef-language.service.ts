import { Injectable } from '@angular/core';
import { of } from 'rxjs';

@Injectable()
export class PefLanguageService {
    public currentLanguage$ = of('de');
}
