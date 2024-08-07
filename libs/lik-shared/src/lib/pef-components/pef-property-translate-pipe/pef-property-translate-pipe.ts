import { OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Subscription } from 'rxjs';

import { Languages } from '../../common/models';
import { PefLanguageService } from '../../common/pef-language.service';

@Pipe({ name: 'pefPropertyTranslate' })
export class PefPropertyTranslatePipe implements PipeTransform, OnDestroy {
    private currentLanguage?: string;

    private subscription = Subscription.EMPTY;

    constructor(pefLanguageService: PefLanguageService) {
        this.subscription.add(pefLanguageService.currentLanguage$.subscribe((lang) => (this.currentLanguage = lang)));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform(value: any) {
        if (!value) return undefined;

        return this.currentLanguage != null && value[this.currentLanguage] != null
            ? value[this.currentLanguage]
            : value[Languages['Deutsch'].languageCode];
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
