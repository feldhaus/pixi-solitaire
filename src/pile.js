import * as PIXI from 'pixi.js';
import { RANKS } from './card';
import { TweenLite } from 'gsap';

export class Pile extends PIXI.Graphics {
    constructor () {
        super();
        this._cards = [];
        this._offset = new PIXI.Point(0, 0);

        this.lineStyle(2, 0, 0.2);
        this.drawRoundedRect(0, 0, 70, 95, 5);

        this._debug = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.addChild(this._debug);
        this._debug.alpha = 0;
        this._debug.width = 80;
        this._debug.height = 105;
        this._debug.x = -5;
        this._debug.y = -5;
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
        if (this.last) {
            this.last.tail = null;
        }
    }

    handle (card) {
    }

    debug (flag) {
        this._debug.alpha = flag ? 0.25 : 0;
    }

    _arrange () {
        const len = this.length - 1;
        const end = {
            x: this.x + this._offset.x * len,
            y: this.y + this._offset.y * len
        }
        const dist = Math.sqrt(Math.pow(end.x - this.last.x, 2) + Math.pow(end.y - this.last.y, 2));
        TweenLite.to(this.last, dist / 1000, {x: end.x, y: end.y});
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

    handle (card) {
        if (this.last) {
            let prev = RANKS.indexOf(this.last.rank) - 1;
            if (prev > -1) {
                return this.last.color !== card.color && card.rank === RANKS[prev];
            } else {
                return false;
            }
        } else {
            return card.rank === 'K';
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
    handle (card) {
        if (!card.tail) {
            if (this.last) {
                let next = RANKS.indexOf(this.last.rank) + 1;
                if (next < RANKS.length) {
                    return this.last.suit === card.suit && card.rank === RANKS[next];
                } else {
                    return false;
                }
            } else {
                return card.rank === 'A';
            }
        }
    }
}

export class PileStock extends Pile {
    constructor () {
        super();
        this._offset.x = 0.2;
        this._offset.y = 0.2;
        
        this._area = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._area.width = 70;
        this._area.height = 95;
        this._area.alpha = 0;
        this.addChild(this._area);
    }

    push (card) {
        super.push(card);
        card.flipDown();
    }

    pop (card) {
        super.pop(card);
        if (this.last) {
            this.last.enable();
        } else {
            this._area.interactive = true;
            this._area.buttonMode = true;
            this._area.once('pointertap', this._onTap, this);
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
        if (this.last) {
            this.last.enableDrag();
        }
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
