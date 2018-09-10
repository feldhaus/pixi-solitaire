import * as PIXI from 'pixi.js';

export const SUITS = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export class Card extends PIXI.Container {
    constructor (suit, rank) {
        super();
        this._suit = suit;
        this._rank = rank;
        this._isRed = suit === 'Diamonds' || suit === 'Hearts';

        this.scale.set(0.5, 0.5);
        this.interactive = false;
        this.buttonMode = false;

        this._dragStartPosition = new PIXI.Point();
        this._dragOffset = new PIXI.Point();
        this._dragging = false;

        this._back = new PIXI.Sprite.fromFrame('cardBack_blue4.png');
        this.addChild(this._back);

        let frame = ['card', this._suit, this._rank, '.png'].join('');
        this._front = new PIXI.Sprite.fromFrame(frame);
        this.addChild(this._front);
        this._front.visible = false;
    }

    move (x, y) {
        if (this.tail) {
            let dist = this.tail.y - this.y;
            this.tail.move(x, y + dist);
        }
        this.position.set(x, y);
    }

    dragStart (position) {
        this.dragging = true;
        this._dragStartPosition = this.position.clone();
        this._dragOffset.set(position.x - this.x, position.y - this.y);
        this.bringFoward();
    }

    dragStop (position) {
        this.dragging = false;
        if (position) {
            this.move(position.x, position.y);
        } else {
            this.move(this._dragStartPosition.x, this._dragStartPosition.y);
        }
    }

    dragMove (position) {
        if (this._dragging) {
            this.move(position.x - this._dragOffset.x, position.y - this._dragOffset.y);
        }
    }

    bringFoward () {
        this.parent.addChild(this);
        if (this.tail) {
            this.tail.bringFoward();
        }
    }

    enable () {
        this._back.visible = false;
        this._front.visible = true;
        this.interactive = true;
        this.buttonMode = true;
    }

    set dragging (value) {
        this._dragging = value;
        if (this._dragging) {
            this._front.tint = 0xaaaaaa;
        } else {
            this._front.tint = 0xffffff;
        }
    }

    get isRed () {
        return this._isRed;
    }

    get isBlack () {
        return !this._isRed;
    }
}