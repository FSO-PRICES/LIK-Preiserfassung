import { EffectsModule } from '@ngrx/effects';

import { PreiserheberEffects } from './preiserheber';

export const BO_EFFECTS = [
    EffectsModule.run(PreiserheberEffects),
];
