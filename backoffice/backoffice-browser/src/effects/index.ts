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
    EffectsModule.run(PreiszuweisungEffects),
    EffectsModule.run(ReportingEffects),
    EffectsModule.run(SettingEffects),
    EffectsModule.run(WarenkorbEffects),
];
