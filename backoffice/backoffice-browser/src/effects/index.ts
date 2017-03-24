import { EffectsModule } from '@ngrx/effects';

import { PreiserheberEffects } from './preiserheber';

import { PreismeldestelleEffects } from './preismeldestelle';

import { RegionEffects } from './region';

import { PreismeldungEffects } from './preismeldung';

import { PreiszuweisungEffects } from './preiszuweisung';

import { PreiserheberInitializationEffects } from './preiserheber-initialization';

import { SettingEffects } from './setting';

import { LoginEffects } from './login';

import { ImporterEffects } from './importer';

import { ExporterEffects } from './exporter';

export const BO_EFFECTS = [
    EffectsModule.run(PreiserheberEffects),
    EffectsModule.run(PreismeldestelleEffects),
    EffectsModule.run(PreismeldungEffects),
    EffectsModule.run(RegionEffects),
    EffectsModule.run(PreiszuweisungEffects),
    EffectsModule.run(PreiserheberInitializationEffects),
    EffectsModule.run(SettingEffects),
    EffectsModule.run(LoginEffects),
    EffectsModule.run(ImporterEffects),
    EffectsModule.run(ExporterEffects)
];
