import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app.module';

import { seedData } from './app-seed-data';

seedData()
    .then(() => {
        platformBrowserDynamic().bootstrapModule(AppModule);
    });

// platformBrowserDynamic().bootstrapModule(AppModule);
