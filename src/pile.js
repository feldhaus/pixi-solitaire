import * as PIXI from 'pixi.js';

import { RANKS, CARD_HEIGHT } from './card';
import { TweenLite } from 'gsap';

export class Pile extends PIXI.Container {
    constructor () {
        super();

        this._cards = [];
        this._offset = new PIXI.Point(0, 0);

        this._highlight = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.addChild(this._highlight);
        this._highlight.alpha = 0.5;
        this._highlight.visible = false;

        this._frame = new PIXI.Graphics();
        this.addChild(this._frame);
    }

    push (card) {
        do {
            this._cards.push(card);
            this._tweenToTop();
            this._listen(card);
            card.bringFoward(); 
            card.pile = this;
            card = card.tail;
        }
        while (card);
    }

    removeAll () {
        for (let i = this._cards.length - 1; i >= 0; i--) {
            this._unlisten(this._cards[i]);
            this._cards[i].pile = null;
            this._cards[i].tail = null;
        }
        this._cards = [];
    }

    pop (card) {
        if (card) {
            const removedCards = this._cards.splice(this._cards.indexOf(card));
            for (let i = 0; i < removedCards.length; i++) {
                this._unlisten(removedCards[i]);
                removedCards[i].pile = null;
            }
        } else {
            card = this._cards.pop();
            this._unlisten();
            card.pile = null;
        }
        if (this.last) {
            this.last.tail = null;
        }
    }

    // eslint-disable-next-line no-unused-vars
    handle (card) {}

    indexOf (card) {
        return this._cards.indexOf(card);
    }

    getCardByIndex (index) {
        return this._cards[index];
    }

    highlight (visible) {
        this._highlight.visible = visible;
    }

    resize (width, height) {
        this._frame.clear();
        this._frame.lineStyle(2, 0, 0.2);
        this._frame.drawRect(-1, -1, width + 2, height + 2);

        this._highlight.width = width + 10;
        this._highlight.height = height + 10;
        this._highlight.x = -5;
        this._highlight.y = -5;

        this._arrange();
    }

    _tweenToTop () {
        const len = this.length - 1;
        const end = {
            x: this.x + this._offset.x * len,
            y: this.y + this._offset.y * len
        };
        const dist = Math.sqrt(Math.pow(end.x - this.last.x, 2) + Math.pow(end.y - this.last.y, 2));
        TweenLite.to(this.last, dist / 1000, {x: end.x, y: end.y});
    }

    _arrange () {
        if (this.length === 0) return;

        const len = this.length;
        for (let i = 0; i < len; i++) {
            this._cards[i].x = this.x + this._offset.x * i;
            this._cards[i].y = this.y + this._offset.y * i;
        }
    }

    // eslint-disable-next-line no-unused-vars
    _listen (card) {}

    _unlisten () {}

    get length () {
        return this._cards.length;
    }

    get last () {
        return this._cards[this._cards.length - 1];
    }
}

export class PileTableau extends Pile {
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

    resize (width, height) {
        this._offset.y = 35 / CARD_HEIGHT * height;
        super.resize(width, height);
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

        this.interactive = true;
        this.buttonMode = true;

        this._offset.x = 0.2;
        this._offset.y = 0.2;
        
        this._area = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._area.alpha = 0;
        this.addChild(this._area);
    }

    push (card) {
        super.push(card);
        card.disableDrag();
    }

    resize (width, height) {
        super.resize(width, height);
        this._area.width = width;
        this._area.height = height;
    }
}

export class PileWaste extends Pile {
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

    resize (width, height, type) {
        if (type === 'horizontal') {
            this._offset.x = 30 / CARD_HEIGHT * height;
            this._offset.y = 0;
        } else {
            this._offset.x = 0;
            this._offset.y = 50 / CARD_HEIGHT * height;
        }
        super.resize(width, height);
    }

    _tweenToTop () {
        if (this.length === 0) return;

        const len = this.length;
        const max = Math.min(len, 3);
        const end = new PIXI.Point();

        for (let i = 0; i < len; i++) {
            if (i < len - 3) {
                end.x = this.x;
                end.y = this.y;
            } else {
                end.x = this.x + this._offset.x * (max - (len - i));
                end.y = this.y + this._offset.y * (max - (len - i));
            }
            const dist = Math.sqrt(Math.pow(end.x - this._cards[i].x, 2) + Math.pow(end.y - this._cards[i].y, 2));
            TweenLite.to(this._cards[i], dist / 1000, {x: end.x, y: end.y});
        }
    }

    _arrange () {
        if (this.length === 0) return;

        const len = this.length;
        const max = Math.min(len, 3);

        for (let i = 0; i < len; i++) {
            if (i < len - 3) {
                this._cards[i].x = this.x;
                this._cards[i].y = this.y;
            } else {
                this._cards[i].x = this.x + this._offset.x * (max - (len - i));
                this._cards[i].y = this.y + this._offset.y * (max - (len - i));
            }
        }
    }
}
