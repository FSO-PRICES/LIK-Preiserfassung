import { Pipe, PipeTransform, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { format } from 'date-fns';
import * as fromRoot from '../../../reducers';

import * as deLocale from 'date-fns/locale/de';
import * as frLocale from 'date-fns/locale/fr';
import * as itLocale from 'date-fns/locale/it';

@Pipe({ name: 'pefMonthTranslate' })
export class PefMonthTranslatePipe implements PipeTransform, OnDestroy {
    private currentLanguage: string;

    private subscriptions = [];

    constructor(store: Store<fromRoot.AppState>) {
        this.subscriptions.push(
            store.select(fromRoot.getCurrentLanguage)
                .subscribe(lang => this.currentLanguage = lang)
        );
    }

    transform(value: string, formatOptions: any) {
        if (!value) return undefined;

        return format(`2000-${value}-01`, 'MMMM', { locale: this.getLocale() });
    }

    getLocale() {
        switch (this.currentLanguage) {
            case 'de':
                return deLocale;

            case 'fr':
                return frLocale;

            case 'it':
                return itLocale;

            default:
                return deLocale;
        }
    }

    ngOnDestroy() {
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }
}
