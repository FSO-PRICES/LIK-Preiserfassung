import { EffectsModule } from '@ngrx/effects';

import { PreiserheberEffects } from './preiserheber';

import { PreismeldestelleEffects } from './preismeldestelle';

import { PreiszuweisungEffects } from './preiszuweisung';

export const BO_EFFECTS = [
    EffectsModule.run(PreiserheberEffects),
    EffectsModule.run(PreismeldestelleEffects),
    EffectsModule.run(PreiszuweisungEffects),
];
