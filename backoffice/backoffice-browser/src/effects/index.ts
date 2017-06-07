import { EffectsModule } from '@ngrx/effects';

import { PreiserheberEffects } from './preiserheber';

import { PreismeldestelleEffects } from './preismeldestelle';

import { PreismeldungEffects } from './preismeldung';

import { PreiszuweisungEffects } from './preiszuweisung';

import { SettingEffects } from './setting';

import { LoginEffects } from './login';

import { ImporterEffects } from './importer';

import { ExporterEffects } from './exporter';

export const BO_EFFECTS = [
    EffectsModule.run(PreiserheberEffects),
    EffectsModule.run(PreismeldestelleEffects),
    EffectsModule.run(PreismeldungEffects),
    EffectsModule.run(PreiszuweisungEffects),
    EffectsModule.run(SettingEffects),
    EffectsModule.run(LoginEffects),
    EffectsModule.run(ImporterEffects),
    EffectsModule.run(ExporterEffects)
];
