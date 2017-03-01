import { EffectsModule } from '@ngrx/effects';

import { PreiserheberEffects } from './preiserheber';

import { PreismeldestelleEffects } from './preismeldestelle';

export const BO_EFFECTS = [
    EffectsModule.run(PreiserheberEffects),
    EffectsModule.run(PreismeldestelleEffects),
];
