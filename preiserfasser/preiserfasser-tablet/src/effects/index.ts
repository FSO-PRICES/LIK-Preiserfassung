import { EffectsModule } from '@ngrx/effects';

import { PreismeldestelleEffects } from './preismeldestelle';
import { DatabaseEffects } from './database';
import { PreismeldungenEffects } from './preismeldungen';
import { WindowLocationEffects } from './window-location';
import { TimeEffects } from './time';


export const PEF_EFFECTS = [
    EffectsModule.run(PreismeldestelleEffects),
    EffectsModule.run(DatabaseEffects),
    EffectsModule.run(PreismeldungenEffects),
    EffectsModule.run(WindowLocationEffects),
    EffectsModule.run(TimeEffects)
];
