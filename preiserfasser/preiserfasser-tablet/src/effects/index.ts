import { EffectsModule } from '@ngrx/effects';

import { DatabaseEffects } from './database';
import { PreiserheberEffects } from './preiserheber';
import { PreismeldestelleEffects } from './preismeldestelle';
import { PreismeldungenEffects } from './preismeldungen';
import { TimeEffects } from './time';
import { WarenkorbEffects } from './warenkorb';
import { SettingEffects } from './setting';
import { StatisticsEffects } from './statistics';

export const PEF_EFFECTS = [
    EffectsModule.run(DatabaseEffects),
    EffectsModule.run(PreiserheberEffects),
    EffectsModule.run(PreismeldestelleEffects),
    EffectsModule.run(PreismeldungenEffects),
    EffectsModule.run(TimeEffects),
    EffectsModule.run(WarenkorbEffects),
    EffectsModule.run(SettingEffects),
    EffectsModule.run(StatisticsEffects)
];
