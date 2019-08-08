import { Directive, EventEmitter, Inject, OnDestroy, Output } from '@angular/core';
import { WINDOW } from 'ngx-window-token';

@Directive({
    selector: '[pefOnClickOutside]',
})
export class PefOnClickOutside implements OnDestroy {
    @Output('pefOnClickOutside') clickedOutside$ = new EventEmitter<MouseEvent>();

    constructor(@Inject(WINDOW) private wndw: Window) {
        wndw.document.addEventListener('click', this.addClickListener());
    }

    ngOnDestroy() {
        this.wndw.document.removeEventListener('click', this.addClickListener());
    }

    addClickListener() {
        return (e: MouseEvent) => {
            this.clickedOutside$.emit(e);
        };
    }
}
