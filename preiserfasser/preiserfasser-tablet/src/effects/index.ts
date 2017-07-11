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
    EffectsModule.run(WarenkorbEffects)
];
