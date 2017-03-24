import { Injectable } from '@angular/core';

import { PefApp } from './app.component';

@Injectable()
export class PefNavControllerProvider {
    constructor(private pefApp: PefApp) { }
    get instance() {
        return (this.pefApp as any).getRootNav();
    }
 }
