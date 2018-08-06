import { Pipe, PipeTransform, OnDestroy } from '@angular/core';
import { PefLanguageService } from '../../common/pef-language.service';
import { PropertyTranslation, Languages } from '../../common/models';

@Pipe({ name: 'pefPropertyTranslate' })
export class PefPropertyTranslatePipe implements PipeTransform, OnDestroy {
    private currentLanguage: string;

    private subscriptions = [];

    constructor(pefLanguageService: PefLanguageService) {
        this.subscriptions.push(pefLanguageService.currentLanguage$.subscribe(lang => (this.currentLanguage = lang)));
    }

    transform(value: PropertyTranslation, formatOptions: any) {
        if (!value) return undefined;

        return value[this.currentLanguage] != null
            ? value[this.currentLanguage]
            : value[Languages.Deutsch.languageCode];
    }

    ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }
}
