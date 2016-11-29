import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { Observable } from 'rxjs';
import { NavController } from 'ionic-angular';
import { DragulaService } from 'ng2-dragula';
import { ProductsService } from '../../services/products-service';
import * as autoScroll from 'dom-autoscroller';

import * as dragula from 'dragula';
// export const dragula: (value?: any) => any = (dragulaExpt as any).default || dragulaExpt;

import * as P from '../../preiserfasser-types';

@Component({
    selector: 'drag-test',
    templateUrl: 'drag-test.html'
})
export class DragTestPage implements OnInit, OnDestroy {

    private scroll;
    public viewPortItems: P.Product[];

    baseItems = [
        { code: 1000, name: 'Weissbrot' },
        { code: 1001, name: 'Ruchbrot' },
        { code: 1002, name: 'Halbweissbrot' },
        { code: 1003, name: 'Andere brot' },
        { code: 1004, name: 'Knäckebrot' },
        { code: 1005, name: 'Schnittbort abgepackt' }
    ];
    public items;

    public products: Observable<P.Product[]>;

    constructor(public navCtrl: NavController, private dragulaService: DragulaService, private productsService: ProductsService, private el: ElementRef) {
        this.items = this.baseItems
            .concat(this.baseItems.map(x => ({ code: x.code + 1000, name: x.name })))
            .concat(this.baseItems.map(x => ({ code: x.code + 2000, name: x.name })))
            .concat(this.baseItems.map(x => ({ code: x.code + 3000, name: x.name })))
            .concat(this.baseItems.map(x => ({ code: x.code + 4000, name: x.name })))
            .concat(this.baseItems.map(x => ({ code: x.code + 5000, name: x.name })));
    }

    ngOnInit() {
        let scrollableContent = this.el.nativeElement.querySelector('pef-virtual-scroll > div.scrollable-content');
        const drake = dragula([scrollableContent], {
            moves: (el, container, handle) => {
                // if (el.classList.contains('scrollable-content')) return false;
                console.log(el, handle);
                if (el.classList.contains('isMouseDown')) return true;
                let searchElement = handle;
                while (searchElement !== el && searchElement.className !== 'drag-handle-button') {
                    searchElement = searchElement.parentElement;
                }
                return searchElement.className === 'drag-handle-button';
            }
        });
        // this.dragulaService.add('my-bag', drake);
        // this.dragulaService.setOptions('my-bag', {
        //     // TODO: get drag handle working with touch properly
        //     moves: (el, container, handle) => {
        //         // if (el.classList.contains('scrollable-content')) return false;
        //         console.log(el, handle);
        //         if (el.classList.contains('isMouseDown')) return true;
        //         let searchElement = handle;
        //         while (searchElement !== el && searchElement.className !== 'drag-handle-button') {
        //             searchElement = searchElement.parentElement;
        //         }
        //         return searchElement.className === 'drag-handle-button';
        //     }
        // });
        // const { drake } =  this.dragulaService.find('my-bag');

        this.scroll = autoScroll([
                window,
                this.el.nativeElement.querySelector('pef-virtual-scroll')
            ], {
                margin: 20,
                maxSpeed: 10,
                scrollWhenOutside: false,
                autoScroll: () => drake.dragging
            });

        this.products = Observable.of(null).delay(1000)
            .flatMap(() => this.productsService.loadProducts(), (_, products: P.Product[]) => products);
    }

    ngOnDestroy() {
        this.dragulaService.destroy('my-bag');
        this.scroll.destroy();
    }
}
