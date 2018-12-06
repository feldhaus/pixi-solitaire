import * as PIXI from 'pixi.js';

export const SUITS = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
export const RANKS = [
    'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'
];
export const UNICODE = {
    'Clubs':    '♣',
    'Diamonds': '♦',
    'Hearts':   '♥',
    'Spades':   '♠'
}
export const CARD_WIDTH = 140;
export const CARD_HEIGHT = 190;

export class Card extends PIXI.Container {
    constructor (suit, rank) {
        super();

        this._suit = suit;
        this._rank = rank;

        // color is based on suit: 0 - black / 1 - red
        this._color = suit === 'Diamonds' || suit === 'Hearts';

        this._faceUp = false;
        this._pile = null;

        // interactive and drag stuffs
        this.interactive = false;
        this.buttonMode = false;

        this._dragStartPosition = new PIXI.Point();
        this._dragOffset = new PIXI.Point();
        this._dragging = false;

        // load the back card texture just once
        if (Card.backTexture === undefined) {
            Card.backTexture = PIXI.Texture.fromFrame('cardBack_blue4.png');
        }

        // create and add back sprite
        this._back = new PIXI.Sprite(Card.backTexture);
        this.addChild(this._back);

        // create and add front sprite
        let frame = ['card', this._suit, this._rank, '.png'].join('');
        this._front = new PIXI.Sprite.fromFrame(frame);
        this._front.visible = false;
        this.addChild(this._front);
    }

    move (x, y) {
        if (this.tail) {
            let dist = this.tail.y - this.y;
            this.tail.move(x, y + dist);
        }
        this.position.set(x, y);
    }

    bringFoward () {
        this.parent.addChild(this);
        if (this.tail) {
            this.tail.bringFoward();
        }
    }

    flipUp () {
        this._faceUp = true;
        this._back.visible = false;
        this._front.visible = true;
    }

    flipDown () {
        this._faceUp = false;
        this._back.visible = true;
        this._front.visible = false;
    }

    enable () {
        this.interactive = true;
        this.buttonMode = true;
    }

    disable () {
        this.interactive = false;
        this.buttonMode = false;
    }

    resize (width, height) {
        this.width = width;
        this.height = height;
    }

    enableDrag () {
        this.enable();
        this.flipUp();
        this
            .on('pointerdown', this._onDragStart, this)
            .on('pointerup', this._onDragStop, this)
            .on('pointerupoutside', this._onDragStop, this)
            .on('pointermove', this._onDragMove, this);
    }

    cancel () {
        this.move(this._dragStartPosition.x, this._dragStartPosition.y);
    }

    toString () {
        return this._rank + UNICODE[this._suit];
    }

    _onDragStart (event) {
        this.moved = false;
        this.dragging = true;
        this._dragStartPosition = this.position.clone();
        this.emit('dragstart', event);

        const position = event.data.getLocalPosition(this.parent);
        this._dragOffset.set(position.x - this.x, position.y - this.y);
        this.bringFoward();
    }

    _onDragMove (event) {
        if (this._dragging) {
            this.moved = true;
            const position = event.data.getLocalPosition(this.parent);
            this.move(
                position.x - this._dragOffset.x,
                position.y - this._dragOffset.y
            );
            this.emit('dragmove', event);
        }
    }

    _onDragStop (event) {
        if (this._dragging) {
            this.dragging = false;
            this.emit('dragstop', event);
        }
    }

    set pile (value) {
        this._pile = value;
    }

    get pile () {
        return this._pile;
    }

    set dragging (value) {
        this._dragging = value;
        if (this._dragging) {
            this._front.tint = 0xaaaaaa;
        } else {
            this._front.tint = 0xffffff;
        }
    }

    get suit () {
        return this._suit;
    }

    get rank () {
        return this._rank;
    }

    get color () {
        return this._color;
    }

    get faceUp () {
        return this._faceUp;
    }
}
