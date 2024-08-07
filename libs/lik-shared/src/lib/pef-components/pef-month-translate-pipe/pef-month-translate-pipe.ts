/*
 * LIK-Preiserfassung
 * Copyright (C) 2024 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
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
