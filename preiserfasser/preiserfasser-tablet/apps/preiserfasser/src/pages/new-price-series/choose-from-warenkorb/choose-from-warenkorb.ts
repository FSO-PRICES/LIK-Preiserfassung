import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChange,
    ViewChild,
} from '@angular/core';
import { IonContent } from '@ionic/angular';
import { assign } from 'lodash';
import { defer, Observable, of } from 'rxjs';
import {
    combineLatest,
    debounceTime,
    delay,
    filter,
    flatMap,
    map,
    mapTo,
    merge,
    publishReplay,
    refCount,
    scan,
    startWith,
    take,
    tap,
} from 'rxjs/operators';

import { pefContains, PefDialogService, PefMessageDialogService, ReactiveComponent } from '@lik-shared';

import * as P from '../../../common-models';
import { DialogNewPmBearbeitungsCodeComponent } from '../../../components/dialog';

interface WarenkorbUiItem {
    isExpanded: boolean;
    showBFS: boolean;
    canSelect: boolean;
    notInSeason: boolean;
    depth: number;
    preismeldungCount: number;
    filteredLeafCount: number;
    warenkorbInfo: P.WarenkorbInfo;
}

interface ClickType {
    action: 'EXPAND' | 'EXPAND_ALL' | 'COLLAPSE_ALL';
    warenkorbItemClicked: WarenkorbUiItem;
}

interface ClickAction {
    warenkorbUiItems: WarenkorbUiItem[];
    scrollToY?: number;
    scrollToItemIndex?: number;
}

@Component({
    selector: 'choose-from-warenkorb',
    styleUrls: ['./choose-from-warenkorb.scss'],
    templateUrl: './choose-from-warenkorb.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChooseFromWarenkorbComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @ViewChild(IonContent, { static: true }) content: IonContent;
    @ViewChild(IonContent, { read: ElementRef, static: true }) contentElementRef: ElementRef;
    @Input() isDesktop: boolean;
    @Input() warenkorb: P.Models.WarenkorbTreeItem[];
    @Input() preismeldungen: P.PreismeldungBag[];
    @Input() currentPreismeldung: P.CurrentPreismeldungBag;
    @Input() currentLanguage: string;
    @Input() erhebungsInfo: P.ErhebungsInfo;
    @Output('closeChooseFromWarenkorb')
    closeChooseFromWarenkorb$: Observable<{
        warenkorbPosition: P.Models.WarenkorbLeaf;
        bearbeitungscode: P.Models.Bearbeitungscode;
    }>;

    public warenkorbUiItems$: Observable<WarenkorbUiItem[]>;
    public numberOfEp$: Observable<number>;

    public warenkorbItemClicked$ = new EventEmitter<WarenkorbUiItem>();
    public warenkorbItemEpExpand$ = new EventEmitter<{ event: MouseEvent; warenkorbUiItem: WarenkorbUiItem }>();
    public selectWarenkorbItem$ = new EventEmitter<WarenkorbUiItem>();
    public ngOnInit$ = new EventEmitter();
    public closeClicked$ = new EventEmitter();
    public collapseAllClicked$ = new EventEmitter();
    public searchString$ = new EventEmitter<string>();
    public currentLanguage$ = this.observePropertyCurrentValue<string>('currentLanguage');

    private subscriptions = [];

    iconMap = {
        1: 'navigation_food',
        2: 'navigation_alcohol_tobacco',
        3: 'navigation_clothing',
        4: 'navigation_living_energy',
        5: 'navigation_furniture',
        6: 'navigation_health',
        7: 'navigation_traffic',
        8: 'navigation_messages',
        9: 'navigation_leisure',
        10: 'navigation_teaching',
        11: 'navigation_restaurants_hotels',
        12: 'navigation_services',
    };

    constructor(pefDialogService: PefDialogService, pefMessageDialogService: PefMessageDialogService) {
        super();

        const currentPreismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungBag>(
            'currentPreismeldung',
        ).pipe(take(1));

        const preismeldungen$ = this.observePropertyCurrentValue<P.PreismeldungBag[]>('preismeldungen').pipe(
            filter(x => !!x),
        );
        const erhebungsInfo$ = this.observePropertyCurrentValue<P.ErhebungsInfo>('erhebungsInfo').pipe(
            filter(x => !!x),
        );
        const warenkobUiItems$ = this.observePropertyCurrentValue<P.WarenkorbInfo[]>('warenkorb').pipe(
            combineLatest(
                preismeldungen$,
                erhebungsInfo$,
                (warenkorb: P.WarenkorbInfo[], preismeldungen: P.PreismeldungBag[], erhebungsInfo: P.ErhebungsInfo) => {
                    const monthNumber = +/\d{2}\.(\d{2}).\d{4}/.exec(erhebungsInfo.erhebungsmonat)[1] - 1;
                    return warenkorb.map(warenkorbInfo => {
                        const notInSeason =
                            warenkorbInfo.warenkorbItem.type === 'LEAF' &&
                            !(warenkorbInfo.warenkorbItem.periodizitaetMonat & (1 << monthNumber));
                        const canSelect =
                            !notInSeason &&
                            !(
                                warenkorbInfo.warenkorbItem.type === 'LEAF' &&
                                warenkorbInfo.warenkorbItem.erhebungstyp === 'z'
                            );
                        return {
                            isExpanded: false,
                            showBFS:
                                warenkorbInfo.warenkorbItem.type === 'LEAF' &&
                                warenkorbInfo.warenkorbItem.erhebungstyp === 'z',
                            canSelect,
                            notInSeason,
                            depth: warenkorbInfo.warenkorbItem.tiefencode,
                            preismeldungCount: preismeldungen.filter(
                                y =>
                                    y.preismeldung.epNummer ===
                                        warenkorbInfo.warenkorbItem.gliederungspositionsnummer &&
                                    y.preismeldung.bearbeitungscode !== 0,
                            ).length,
                            filteredLeafCount: warenkorbInfo.leafCount,
                            warenkorbInfo,
                        };
                    });
                },
            ),
            delay(100),
            startWith([]),
        );

        const warenkobUiItemsFiltered$ = warenkobUiItems$.pipe(
            combineLatest(
                this.searchString$.pipe(
                    debounceTime(500),
                    startWith(null),
                ),
                this.currentLanguage$,
                (warenkobUiItems: WarenkorbUiItem[], searchString: string, currentLanguage: string) => {
                    if (searchString === null) {
                        return warenkobUiItems;
                    }
                    const filtered = warenkobUiItems.filter(
                        x =>
                            x.warenkorbInfo.warenkorbItem.type === 'BRANCH' ||
                            (x.warenkorbInfo.warenkorbItem.type === 'LEAF' &&
                                pefContains(searchString, x, [
                                    y => y.warenkorbInfo.warenkorbItem.gliederungspositionsnummer,
                                    y => y.warenkorbInfo.warenkorbItem.positionsbezeichnung[currentLanguage],
                                    y =>
                                        !y.warenkorbInfo.warenkorbItem.beispiele
                                            ? null
                                            : y.warenkorbInfo.warenkorbItem.beispiele[currentLanguage],
                                ])),
                    );
                    return filtered.map(x =>
                        assign({}, x, {
                            filteredLeafCount:
                                x.warenkorbInfo.warenkorbItem.type === 'LEAF'
                                    ? 0
                                    : this.findDescendantsOfWarenkorbItem(
                                          filtered,
                                          x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer,
                                      ).filter(y => y.warenkorbInfo.warenkorbItem.type === 'LEAF').length,
                        }),
                    );
                },
            ),
            publishReplay(1),
            refCount(),
        );

        const warenkorbItemEpExpand$ = this.warenkorbItemEpExpand$.pipe(tap(x => x.event.stopPropagation()));
        // TODO if still works.observeOnZone(zone);

        const clickAction$ = this.warenkorbItemClicked$.pipe(
            filter(x => x.warenkorbInfo.warenkorbItem.type === 'BRANCH'),
            map(x => ({ action: 'EXPAND', warenkorbItemClicked: x })),
            merge(
                warenkorbItemEpExpand$.pipe(
                    map(x => ({ action: 'EXPAND_ALL', warenkorbItemClicked: x.warenkorbUiItem })),
                ),
            ),
            merge(this.collapseAllClicked$.pipe(map(() => ({ action: 'COLLAPSE_ALL' })))),
            startWith(null),
            combineLatest(
                warenkobUiItemsFiltered$,
                currentPreismeldung$,
                (
                    clickType: ClickType,
                    warenkorb: WarenkorbUiItem[],
                    currentPreismeldung: P.CurrentPreismeldungBag,
                ) => ({ clickType, warenkorb, currentPreismeldung }),
            ),
            scan(
                (agg, v) => {
                    if (v.clickType == null && !v.currentPreismeldung) {
                        return {
                            warenkorbUiItems: v.warenkorb.filter(x => x.warenkorbInfo.warenkorbItem.tiefencode === 2),
                        };
                    }
                    if (v.clickType == null && !!v.currentPreismeldung) {
                        const parents = this.findParentsOfWarenkorbItem(
                            v.warenkorb,
                            v.currentPreismeldung.warenkorbPosition.parentGliederungspositionsnummer,
                        ).map(x => x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer);
                        const warenkorbUiItems = v.warenkorb
                            .filter(
                                x =>
                                    x.warenkorbInfo.warenkorbItem.tiefencode === 2 ||
                                    x.warenkorbInfo.warenkorbItem.parentGliederungspositionsnummer ===
                                        v.currentPreismeldung.warenkorbPosition.parentGliederungspositionsnummer ||
                                    parents.some(
                                        p => p === x.warenkorbInfo.warenkorbItem.parentGliederungspositionsnummer,
                                    ),
                            )
                            .map(x =>
                                parents.some(p => p === x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer)
                                    ? assign({}, x, { isExpanded: true })
                                    : x,
                            );
                        return {
                            warenkorbUiItems,
                            scrollToItemIndex: warenkorbUiItems.findIndex(
                                x =>
                                    x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer ===
                                    v.currentPreismeldung.warenkorbPosition.gliederungspositionsnummer,
                            ),
                        };
                    }
                    if (v.clickType.action === 'COLLAPSE_ALL') {
                        return {
                            warenkorbUiItems: v.warenkorb.filter(x => x.warenkorbInfo.warenkorbItem.tiefencode === 2),
                            scrollToY: 0,
                        };
                    }
                    const clickedGliederungspositionsnummer =
                        v.clickType.warenkorbItemClicked.warenkorbInfo.warenkorbItem.gliederungspositionsnummer;
                    if (v.clickType.warenkorbItemClicked.isExpanded) {
                        const descendants = this.findDescendantsOfWarenkorbItem(
                            v.warenkorb,
                            clickedGliederungspositionsnummer,
                        ).map(x => x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer);
                        return {
                            warenkorbUiItems: v.warenkorb
                                .filter(
                                    x =>
                                        agg.warenkorbUiItems.some(
                                            y =>
                                                y.warenkorbInfo.warenkorbItem.gliederungspositionsnummer ===
                                                x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer,
                                        ) &&
                                        !descendants.some(
                                            y => y === x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer,
                                        ),
                                )
                                .map(x =>
                                    x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer ===
                                    clickedGliederungspositionsnummer
                                        ? assign({}, x, { isExpanded: false })
                                        : agg.warenkorbUiItems.find(
                                              y =>
                                                  y.warenkorbInfo.warenkorbItem.gliederungspositionsnummer ===
                                                  x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer,
                                          ) || x,
                                ),
                        };
                    }
                    if (v.clickType.action === 'EXPAND') {
                        return {
                            warenkorbUiItems: v.warenkorb
                                .filter(
                                    x =>
                                        agg.warenkorbUiItems.some(
                                            y =>
                                                y.warenkorbInfo.warenkorbItem.gliederungspositionsnummer ===
                                                x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer,
                                        ) ||
                                        x.warenkorbInfo.warenkorbItem.parentGliederungspositionsnummer ===
                                            clickedGliederungspositionsnummer,
                                )
                                .map(x => {
                                    const itemInAgg = agg.warenkorbUiItems.find(
                                        y =>
                                            y.warenkorbInfo.warenkorbItem.gliederungspositionsnummer ===
                                            x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer,
                                    );
                                    return assign({}, x, {
                                        isExpanded: itemInAgg ? itemInAgg.isExpanded : x.isExpanded,
                                    });
                                })
                                .map(x =>
                                    x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer ===
                                    clickedGliederungspositionsnummer
                                        ? assign({}, x, { isExpanded: true })
                                        : agg.warenkorbUiItems.find(
                                              y =>
                                                  y.warenkorbInfo.warenkorbItem.gliederungspositionsnummer ===
                                                  x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer,
                                          ) || x,
                                ),
                        };
                    } else {
                        const descendants = this.findDescendantsOfWarenkorbItem(
                            v.warenkorb,
                            clickedGliederungspositionsnummer,
                        )
                            .filter(x => x.warenkorbInfo.warenkorbItem.type === 'LEAF')
                            .map(x => x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer);
                        return {
                            warenkorbUiItems: v.warenkorb
                                .filter(
                                    x =>
                                        agg.warenkorbUiItems.some(
                                            y =>
                                                y.warenkorbInfo.warenkorbItem.gliederungspositionsnummer ===
                                                x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer,
                                        ) ||
                                        descendants.some(
                                            y => y === x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer,
                                        ),
                                )
                                .map(x => {
                                    const itemInAgg = agg.warenkorbUiItems.find(
                                        y =>
                                            y.warenkorbInfo.warenkorbItem.gliederungspositionsnummer ===
                                            x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer,
                                    );
                                    return assign({}, x, {
                                        isExpanded: itemInAgg ? itemInAgg.isExpanded : x.isExpanded,
                                        depth: itemInAgg ? itemInAgg.depth : v.clickType.warenkorbItemClicked.depth + 1,
                                    });
                                })
                                .map(x =>
                                    x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer ===
                                    clickedGliederungspositionsnummer
                                        ? assign({}, x, { isExpanded: true })
                                        : agg.warenkorbUiItems.find(
                                              y =>
                                                  y.warenkorbInfo.warenkorbItem.gliederungspositionsnummer ===
                                                  x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer,
                                          ) || x,
                                ),
                        };
                    }
                },
                { warenkorbUiItems: [] } as ClickAction,
            ),
            publishReplay(1),
            refCount(),
        );

        this.warenkorbUiItems$ = clickAction$.pipe(map(x => x.warenkorbUiItems));

        this.subscriptions.push(
            clickAction$
                .pipe(
                    map(x => x.scrollToY),
                    filter(x => x !== undefined),
                    delay(300),
                )
                .subscribe(scrollToY => {
                    const nativeElement = this.contentElementRef.nativeElement as HTMLElement;
                    nativeElement.scrollTo(0, scrollToY);
                }),
        );

        this.subscriptions.push(
            clickAction$
                .pipe(
                    map(x => x.scrollToItemIndex),
                    filter(x => x !== undefined),
                    delay(600),
                )
                .subscribe(scrollToItemIndex => {
                    const nativeElement = this.contentElementRef.nativeElement as HTMLElement;
                    const ionItems = Array.prototype.slice.call(
                        nativeElement.getElementsByTagName('ion-item'),
                    ) as HTMLElement[];
                    const ionItemsTop = ionItems.map(x => x.getBoundingClientRect().top);
                    nativeElement.scrollTo(0, ionItemsTop[scrollToItemIndex] - ionItemsTop[0]);
                }),
        );

        this.numberOfEp$ = warenkobUiItemsFiltered$.pipe(
            map(x => x.filter(y => y.warenkorbInfo.warenkorbItem.type === 'LEAF').length),
            startWith(0),
        );

        const dialogSufficientPreismeldungen$ = defer(() =>
            pefMessageDialogService.displayDialogYesNo('dialogText_ausreichend-artikel').pipe(map(x => x.data)),
        );
        const dialogNewPmbearbeitungsCode$ = defer(() =>
            pefDialogService
                .displayDialog(DialogNewPmBearbeitungsCodeComponent, {
                    dialogOptions: { cssClass: 'new-pm-bearbeitungs-code-popover' },
                })
                .pipe(map(x => x.data)),
        );

        this.closeChooseFromWarenkorb$ = this.selectWarenkorbItem$.pipe(
            flatMap(warenkorbUiItem =>
                (warenkorbUiItem.preismeldungCount >=
                (warenkorbUiItem.warenkorbInfo.warenkorbItem as P.Models.WarenkorbLeaf).anzahlPreiseProPMS
                    ? dialogSufficientPreismeldungen$
                    : of('YES')
                ).pipe(map(x => ({ answer: x, warenkorbUiItem }))),
            ),
            filter(x => x.answer === 'YES'),
            map(x => x.warenkorbUiItem.warenkorbInfo.warenkorbItem),
            flatMap(warenkorbPosition =>
                dialogNewPmbearbeitungsCode$.pipe(
                    filter(dialogReturnValue => dialogReturnValue.action === 'OK'),
                    map(dialogReturnValue => ({
                        warenkorbPosition,
                        bearbeitungscode: dialogReturnValue.bearbeitungscode,
                    })),
                ),
            ),
            merge(this.closeClicked$.pipe(mapTo(null))),
        );
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }

    findDescendantsOfWarenkorbItem(
        warenkorb: WarenkorbUiItem[],
        gliederungspositionsnummer: string,
    ): WarenkorbUiItem[] {
        return warenkorb
            .filter(x => x.warenkorbInfo.warenkorbItem.parentGliederungspositionsnummer === gliederungspositionsnummer)
            .reduce(
                (agg, v) => [
                    ...agg,
                    v,
                    ...this.findDescendantsOfWarenkorbItem(
                        warenkorb,
                        v.warenkorbInfo.warenkorbItem.gliederungspositionsnummer,
                    ),
                ],
                [],
            );
    }

    findParentsOfWarenkorbItem(
        warenkorb: WarenkorbUiItem[],
        parentGliederungspositionsnummer: string,
    ): WarenkorbUiItem[] {
        return warenkorb
            .filter(x => x.warenkorbInfo.warenkorbItem.gliederungspositionsnummer === parentGliederungspositionsnummer)
            .reduce(
                (agg, v) => [
                    ...agg,
                    v,
                    ...this.findParentsOfWarenkorbItem(
                        warenkorb,
                        v.warenkorbInfo.warenkorbItem.parentGliederungspositionsnummer,
                    ),
                ],
                [],
            );
    }
}
