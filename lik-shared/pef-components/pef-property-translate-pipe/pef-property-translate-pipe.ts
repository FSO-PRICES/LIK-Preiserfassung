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
