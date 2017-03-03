import { Component, EventEmitter } from '@angular/core';
import { Store } from '@ngrx/store';
import { LoadingController } from 'ionic-angular';

import { reduce } from 'lodash';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../../reducers';
import { Actions as PreiszuweisungAction, PreiszuweisungLoad, SelectPreiszuweisung, UpdateCurrentPreiszuweisung, SavePreiszuweisung } from '../../actions/preiszuweisung';
import { Observable } from 'rxjs';

@Component({
    selector: 'preiserheber',
    templateUrl: 'preiserheber.html'
})
export class PreiserheberPage {
    public preiserhebers$ = this.store.select(fromRoot.getPreiserhebers);
    public currentPreiserheber$ = this.store.select(fromRoot.getCurrentPreiserheber).publishReplay(1).refCount();
    public preiszuweisungen$ = this.store.select(fromRoot.getPreiszuweisungen);
    public currentPreiszuweisung$ = this.store.select(fromRoot.getCurrentPreiszuweisung).publishReplay(1).refCount();
    public preismeldestellen$ = this.store.select(fromRoot.getPreismeldestellen);
    public unassignedPreismeldestellen$: Observable<P.AdvancedPreismeldestelle[]>;
    public selectPreiserheber$ = new EventEmitter<string>();
    public clearSelectedPreiserheber$ = new EventEmitter();
    public savePreiserheber$ = new EventEmitter();
    public updatePreiserheber$ = new EventEmitter<P.Erheber>();
    public updatePreiszuweisung$ = new EventEmitter<P.Preiszuweisung>();

    constructor(private store: Store<fromRoot.AppState>, private loadingCtrl: LoadingController) {
        const loader = this.loadingCtrl.create({
            content: 'Datensynchronisierung. Bitte warten...'
        });

        this.unassignedPreismeldestellen$ = this.preiszuweisungen$
            .combineLatest(this.preismeldestellen$, (preiszuweisungen: P.Preiszuweisung[], preismeldestellen: P.AdvancedPreismeldestelle[]) => ({ preiszuweisungen, preismeldestellen }))
            .combineLatest(this.currentPreiserheber$, ({ preiszuweisungen, preismeldestellen }, preiserheber) => ({ preiszuweisungen, preismeldestellen, preiserheber: <P.Erheber>preiserheber }))
            .filter(({ preismeldestellen }) => !!preismeldestellen)
            .map(({ preiszuweisungen, preismeldestellen, preiserheber }) => {
                if (!!preiserheber && !!preiszuweisungen) {
                    const alreadyAssigned = reduce(preiszuweisungen, (prev, curr) => {
                        return curr._id !== preiserheber._id ? prev.concat(curr.preismeldestellen) : prev;
                    }, []);
                    return preismeldestellen.filter(x => alreadyAssigned.indexOf(x.pmsNummer) === -1);
                }
                return preismeldestellen;
            });

        this.selectPreiserheber$
            .subscribe((x: string) => {
                store.dispatch({ type: 'SELECT_PREISERHEBER', payload: x });
                store.dispatch(<PreiszuweisungAction>{ type: SelectPreiszuweisung, payload: x });
            });

        this.clearSelectedPreiserheber$
            .subscribe(x => {
                store.dispatch({ type: 'SELECT_PREISERHEBER', payload: null });
                store.dispatch(<PreiszuweisungAction>{ type: SelectPreiszuweisung, payload: null });
            });

        this.updatePreiserheber$
            .subscribe(x => store.dispatch({ type: 'UPDATE_CURRENT_PREISERHEBER', payload: x }));
        this.updatePreiszuweisung$
            .subscribe((x: P.Preiszuweisung) => store.dispatch(<PreiszuweisungAction>{ type: UpdateCurrentPreiszuweisung, payload: x }));

        this.savePreiserheber$
            .do(() => loader.present())
            .subscribe(password => {
                store.dispatch({ type: 'SAVE_PREISERHEBER', payload: password });
                store.dispatch(<PreiszuweisungAction>{ type: SavePreiszuweisung });
            });

        this.currentPreiserheber$.filter(pe => !!pe && pe.isSaved).subscribe(() => loader.dismiss());
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'PREISERHEBER_LOAD' });
        this.store.dispatch({ type: 'PREISMELDESTELLE_LOAD' });
        this.store.dispatch({ type: PreiszuweisungLoad });
    }
}
