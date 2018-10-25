/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import { Pipe, PipeTransform, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { format } from 'date-fns';

import * as deLocale from 'date-fns/locale/de';
import * as enLocale from 'date-fns/locale/en';
import * as frLocale from 'date-fns/locale/fr';
import * as itLocale from 'date-fns/locale/it';
import { Subscription } from 'rxjs';
import { PefLanguageService } from '../../common/pef-language.service';

@Pipe({ name: 'pefDateTranslate', pure: false })
export class PefDateTranslatePipe implements PipeTransform, OnDestroy {
    private latestValue: string = null;
    private latestReturnValue: string = null;

    private currentLanguage: string;

    private subscriptions: Subscription[] = [];

    constructor(pefLanguageService: PefLanguageService) {
        this.subscriptions.push(
            pefLanguageService.currentLanguage$
                .subscribe(lang => {
                    this.currentLanguage = lang;
                })
        );
    }

    transform(value: any, formatOptions: any) {
        if (!value) return undefined;

        return format(value, formatOptions, { locale: this.getLocale() });
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
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }
}
