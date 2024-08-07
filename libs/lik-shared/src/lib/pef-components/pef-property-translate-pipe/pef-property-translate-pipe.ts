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
