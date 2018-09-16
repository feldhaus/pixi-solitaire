import * as PIXI from 'pixi.js';

export class Pile extends PIXI.Graphics {
    constructor () {
        super();
        this._cards = [];
        this._offset = new PIXI.Point(0, 0);

        this.lineStyle(2, 0, 0.2);
        this.drawRoundedRect(0, 0, 70, 95, 5);
    }

    push (card) {
        do {
            this._cards.push(card);
            this._arrange();
            this._listen(card);
            card.bringFoward(); 
            card.pile = this;
            card = card.tail;
        }
        while (card);
    }

    pop (card) {
        if (card) {
            let removedCards = this._cards.splice(this._cards.indexOf(card));
            for (let i = 0; i < removedCards.length; i++) {
                this._unlisten(removedCards[i]);
            }
        } else {
            this._cards.pop();
            this._unlisten(card);
        }
    }

    hitTest (card) {
        return false;
    }

    _arrange () {
        const len = this.length - 1;
        this.last.x = this.x + this._offset.x * len;
        this.last.y = this.y + this._offset.y * len;
    }

    _listen (card) {
    }

    _unlisten (card) {
    }

    get length () {
        return this._cards.length;
    }

    get last () {
        return this._cards[this._cards.length - 1];
    }
}

export class PileTableau extends Pile {
    constructor () {
        super();
        this._offset.y = 30;
    }

    pop (card) {
        super.pop(card);
        if (this.last) {
            this.last.enableDrag();
        }
    }

    _listen (card) {
        card.on('dragstart', this._onStartDrag, this);
    }

    _unlisten (card) {
        card.removeListener('dragstart', this._onStartDrag, this);
    }

    _onStartDrag (event) {
        let card = event.target;
        let i = this._cards.indexOf(card);
        for (i; i < this.length - 1; i++) {
            this._cards[i].tail = this._cards[i + 1];
        }
    }
}

export class PileFoundation extends Pile {
}

export class PileStock extends Pile {
    constructor () {
        super();
        this._offset.x = 0.2;
        this._offset.y = 0.2;
    }

    pop (card) {
        super.pop(card);
        if (this.last) {
            this.last.enable();
        }
    }

    _listen (card) {
        card.once('pointertap', this._onTap, this);
    }

    _onTap (event) {
        this.emit('tap', event);
    }
}

export class PileWaste extends Pile {
    constructor () {
        super();
        this._offset.x = 20;
    }

    push (card) {
        if (this.last) {
            this.last.disable();
        }
        super.push(card);
        card.enableDrag();
    }

    pop (card) {
        super.pop(card);
        this._arrange();
    }

    _arrange () {
        const len = this.length;
        const max = Math.min(len, 3);

        for (let i = 0; i < len; i++) {
            if (i < len - 3) {
                this._cards[i].x = this.x;
            } else {
                this._cards[i].x = this.x + this._offset.x * (max - (len - i));
            }
            this._cards[i].y = this.y;
        }
    }
}
