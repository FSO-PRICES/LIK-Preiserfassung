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

import { CockpitEffects } from './cockpit';
import { ControllingEffects } from './controlling';
import { ExporterEffects } from './exporter';
import { ImporterEffects } from './importer';
import { LoginEffects } from './login';
import { OnOfflineEffects } from './onoffline';
import { PreiserheberEffects } from './preiserheber';
import { PreismeldestelleEffects } from './preismeldestelle';
import { PreismeldungEffects } from './preismeldung';
import { PreismeldungenStatusEffects } from './preismeldungen-status';
import { PreiszuweisungEffects } from './preiszuweisung';
import { ReportingEffects } from './reporting';
import { SettingEffects } from './setting';
import { WarenkorbEffects } from './warenkorb';

export const BO_EFFECTS = [
    EffectsModule.run(CockpitEffects),
    EffectsModule.run(ControllingEffects),
    EffectsModule.run(ExporterEffects),
    EffectsModule.run(ImporterEffects),
    EffectsModule.run(LoginEffects),
    EffectsModule.run(OnOfflineEffects),
    EffectsModule.run(PreiserheberEffects),
    EffectsModule.run(PreismeldestelleEffects),
    EffectsModule.run(PreismeldungEffects),
    EffectsModule.run(PreismeldungenStatusEffects),
    EffectsModule.run(PreiszuweisungEffects),
    EffectsModule.run(ReportingEffects),
    EffectsModule.run(SettingEffects),
    EffectsModule.run(WarenkorbEffects),
];
