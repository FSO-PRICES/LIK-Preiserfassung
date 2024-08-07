import { OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { format } from 'date-fns';
import { Subscription } from 'rxjs';

import { getLocale } from '../../common/locale';
import { PefLanguageService } from '../../common/pef-language.service';

@Pipe({ name: 'pefDateTranslate', pure: false })
export class PefDateTranslatePipe implements PipeTransform, OnDestroy {
    private currentLanguage?: string = undefined;

    private subscriptions: Subscription[] = [];

    constructor(pefLanguageService: PefLanguageService) {
        this.subscriptions.push(
            pefLanguageService.currentLanguage$.subscribe((lang) => {
                this.currentLanguage = lang;
            }),
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform(value: any, formatOptions: any) {
        if (!value) return undefined;

        return format(value, formatOptions, { locale: getLocale(this.currentLanguage) });
    }

    ngOnDestroy() {
        this.subscriptions.filter((s) => !!s && !s.closed).forEach((s) => s.unsubscribe());
    }
}
