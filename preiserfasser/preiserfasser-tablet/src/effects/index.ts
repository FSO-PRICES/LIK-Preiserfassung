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

import { EffectsModule } from '@ngrx/effects';

import { DatabaseEffects } from './database';
import { ErhebungsInfoEffects } from './erhebungsinfo';
import { LoginEffects } from './login';
import { PreiserheberEffects } from './preiserheber';
import { PreismeldestelleEffects } from './preismeldestelle';
import { PreismeldungenEffects } from './preismeldungen';
import { SettingEffects } from './setting';
import { StatisticsEffects } from './statistics';
import { TimeEffects } from './time';
import { WarenkorbEffects } from './warenkorb';
import { CreatePdfEffects } from './create-pdf';

export const PEF_EFFECTS = [
    EffectsModule.run(DatabaseEffects),
    EffectsModule.run(ErhebungsInfoEffects),
    EffectsModule.run(LoginEffects),
    EffectsModule.run(PreiserheberEffects),
    EffectsModule.run(PreismeldestelleEffects),
    EffectsModule.run(PreismeldungenEffects),
    EffectsModule.run(SettingEffects),
    EffectsModule.run(StatisticsEffects),
    EffectsModule.run(TimeEffects),
    EffectsModule.run(WarenkorbEffects),
    EffectsModule.run(CreatePdfEffects)
];
