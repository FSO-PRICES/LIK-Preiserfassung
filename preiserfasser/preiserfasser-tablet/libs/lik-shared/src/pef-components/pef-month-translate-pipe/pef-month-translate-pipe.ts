import { Pipe, PipeTransform, OnDestroy } from '@angular/core';
import { format } from 'date-fns';

import * as deLocale from 'date-fns/locale/de';
import * as enLocale from 'date-fns/locale/en';
import * as frLocale from 'date-fns/locale/fr';
import * as itLocale from 'date-fns/locale/it';
import { PefLanguageService } from '../../common/pef-language.service';

@Pipe({ name: 'pefMonthTranslate' })
export class PefMonthTranslatePipe implements PipeTransform, OnDestroy {
    private currentLanguage: string;

    private subscriptions = [];

    constructor(pefLanguageService: PefLanguageService) {
        this.subscriptions.push(pefLanguageService.currentLanguage$.subscribe(lang => (this.currentLanguage = lang)));
    }

    transform(value: string, _formatOptions: any) {
        if (!value) return undefined;

        return format(`2000-${value}-01`, 'MMMM', { locale: this.getLocale() });
    }

    getLocale() {
        switch (this.currentLanguage) {
            case 'de':
                return deLocale;

            case 'en':
                return enLocale;

            case 'fr':
                return frLocale;

            case 'it':
                return itLocale;

            default:
                return deLocale;
        }
    }

    ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }
}
