import { EffectsModule } from '@ngrx/effects';

import { DatabaseEffects } from './database';
import { PreismeldestelleEffects } from './preismeldestelle';
import { PreismeldungenEffects } from './preismeldungen';
import { TimeEffects } from './time';
import { WarenkorbEffects } from './warenkorb';
import { WindowLocationEffects } from './window-location';

export const PEF_EFFECTS = [
    EffectsModule.run(DatabaseEffects),
    EffectsModule.run(PreismeldestelleEffects),
    EffectsModule.run(PreismeldungenEffects),
    EffectsModule.run(TimeEffects),
    EffectsModule.run(WindowLocationEffects),
    EffectsModule.run(WarenkorbEffects),
];
