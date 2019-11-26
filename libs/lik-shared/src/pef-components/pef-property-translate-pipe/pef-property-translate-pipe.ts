import { OnDestroy, Pipe, PipeTransform } from '@angular/core';

import { Languages, PropertyTranslation } from '../../common/models';
import { PefLanguageService } from '../../common/pef-language.service';

@Pipe({ name: 'pefPropertyTranslate' })
export class PefPropertyTranslatePipe implements PipeTransform, OnDestroy {
    private currentLanguage: string;

    private subscriptions = [];

    constructor(pefLanguageService: PefLanguageService) {
        this.subscriptions.push(pefLanguageService.currentLanguage$.subscribe(lang => (this.currentLanguage = lang)));
    }

    transform(value: PropertyTranslation, _formatOptions: any) {
        if (!value) return undefined;

        return value[this.currentLanguage] != null
            ? value[this.currentLanguage]
            : value[Languages.Deutsch.languageCode];
    }

    ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }
}
