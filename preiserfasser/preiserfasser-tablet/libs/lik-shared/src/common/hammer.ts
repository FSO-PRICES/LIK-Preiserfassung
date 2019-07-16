import { Injectable } from '@angular/core';
import { HammerGestureConfig } from '@angular/platform-browser';

@Injectable()
export class PefHammerGestureConfig extends HammerGestureConfig {
    overrides = {
        press: { threshold: 30, time: 1200 },
        tap: { threshold: 50, posTreshold: 2, time: 2000 }, // default 2, 10
        pan: { threshold: 60, posTreshold: 2 }, // default 2, 10
    };
}
