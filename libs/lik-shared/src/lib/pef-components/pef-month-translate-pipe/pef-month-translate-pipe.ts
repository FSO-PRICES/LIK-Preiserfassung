import { OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { format } from 'date-fns';
import { Subscription } from 'rxjs';

import { getLocale } from '../../common/locale';
import { PefLanguageService } from '../../common/pef-language.service';

@Pipe({ name: 'pefMonthTranslate' })
export class PefMonthTranslatePipe implements PipeTransform, OnDestroy {
    private currentLanguage?: string;

    private subscriptions: Subscription[] = [];

    constructor(pefLanguageService: PefLanguageService) {
        this.subscriptions.push(pefLanguageService.currentLanguage$.subscribe((lang) => (this.currentLanguage = lang)));
    }

    transform(value: string | number) {
        if (!value) return undefined;

        return format(new Date(`2000-${value}-01`), 'MMM', { locale: getLocale(this.currentLanguage) });
    }

    ngOnDestroy() {
        this.subscriptions.filter((s) => !!s && !s.closed).forEach((s) => s.unsubscribe());
    }
}
