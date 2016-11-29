import { Component, Input } from '@angular/core';
import { DragulaService } from 'ng2-dragula';

import * as P from '../../../preiserfasser-types';

@Component({
    selector: 'drag-test-list-item',
    templateUrl: 'drag-test-list-item.html',
    host: {
        '[class.isMouseDown]': 'isMouseDown'
    }
})
export class DragTestListItem {
    @Input() product: P.Product;

    public isMouseDown = false;

    constructor(private dragulaService: DragulaService) {
        this.dragulaService.dragend
            .subscribe(x => this.isMouseDown = false);
    }

    // TODO: get drag handle working with touch properly

    dragButtonDown(e) {
        // e.preventDefault();
        // e.stopPropagation();
        this.isMouseDown = true;
    }
}
