import * as PIXI from 'pixi.js';

import { Card, SUITS, RANKS } from './card';

export class Game {
    constructor (width, height) {
        this.app = new PIXI.Application(width, height, { backgroundColor: 0x076324, antialias: true });
        document.body.appendChild(this.app.view);

        this._deck = [];
    }

    load () {
        PIXI.loader
            .add('cards', './assets/cards.json')
            .load(this._onAssetsLoaded.bind(this));
    }

    _onAssetsLoaded () {
        this._setup();
        this._layout();
    }

    _setup () {
        SUITS.forEach(suit => {
            RANKS.forEach(rank => {
                let card = new Card(suit, rank);
                this._deck.push(card);
                this.app.stage.addChild(card);
                card
                    .on('pointerdown', this._onDragStart.bind(this))
                    .on('pointerup', this._onDragStop.bind(this))
                    .on('pointerupoutside', this._onDragStop.bind(this))
                    .on('pointermove', this._onDragMove.bind(this));
            });
        });
    }

    _layout () {
        let ix = 0;
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < i+1; j++) {
                this._deck[ix].x = i * 100;
                this._deck[ix].y = 120 + j * 30;
                if (j > 0) {
                    this._deck[ix].head = this._deck[ix - 1];
                    this._deck[ix - 1].tail = this._deck[ix];
                }
                if (j === i) {
                    this._deck[ix].enable();
                }
                ix++;
            }
        }
    }

    _onDragStart (event) {
        let card = event.target;
        let newPosition = event.data.getLocalPosition(card.parent);
        card.dragStart(newPosition);
    }

    _onDragStop (event) {
        let card = event.currentTarget;

        let newPosition = event.data.getLocalPosition(card.parent);

        for (let i = 0; i < this._deck.length; i++) {
            if (this._deck[i].interactive) {
                if (this._deck[i].getBounds().contains(newPosition.x, newPosition.y)) {
                    if (this._deck[i].isRed === card.isBlack) {
                        console.log(this._deck[i]._suit, this._deck[i]._rank);
                        let pos = this._deck[i].position.clone();
                        pos.y += 30;
                        card.dragStop(pos);
                        card.head = this._deck[i];
                        this._deck[i].tail = card;
                        return;
                    }
                }
            }
        }

        card.dragStop();
    }

    _onDragMove (event) {
        let card = event.currentTarget;
        let newPosition = event.data.getLocalPosition(card.parent);
        card.dragMove(newPosition);
    }
}

let game = new Game(800, 600);
game.load();