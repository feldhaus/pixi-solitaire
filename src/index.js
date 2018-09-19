import * as PIXI from 'pixi.js';

import { Deck } from './deck';
import { PileTableau, PileFoundation, PileStock, PileWaste } from './pile';

const TABLEAU = 7;
const FOUNDATION = 4;

export class Game {
    constructor (width, height) {
        this.app = new PIXI.Application(width, height, { backgroundColor: 0x076324, antialias: true });
        document.body.appendChild(this.app.view);

        // init a deck
        this._deck = new Deck();

        // init the piles
        this._stock = new PileStock();
        this._waste = new PileWaste();
        this._tableau = new Array(TABLEAU).fill().map(() => new PileTableau());
        this._foundation = new Array(FOUNDATION).fill().map(() => new PileFoundation());
    }

    load () {
        PIXI.loader
            .add('cards', './assets/cards.json')
            .load(this._onAssetsLoaded.bind(this));
    }

    _onAssetsLoaded () {
        this._setup();
        this._deal();
    }

    _setup () {
        this._deck.create();
        this._deck.cards.forEach(card => {
            this.app.stage.addChild(card);
        });

        this._stock.position.set(0, 0);
        this.app.stage.addChildAt(this._stock, 0);

        this._waste.position.set(100, 0);
        this.app.stage.addChildAt(this._waste, 0);

        this._foundation.forEach((pile, index) => {
            pile.position.set((3 + index) * 100, 0);
            this.app.stage.addChildAt(pile, 0);
        });

        this._tableau.forEach((pile, index) => {
            pile.position.set(index * 100, 120);
            this.app.stage.addChildAt(pile, 0);
        });
    }

    _deal () {
        // shuffle the deck
        this._deck.shuffle(780);

        // listen to when any card is dropped
        this._deck.cards.forEach(card => {
            card.on('dragstop', this._onDragStop, this);
            card.on('dragmove', this._onDragMove, this);
        });

        // deal the cards on the tableau
        let ix = 0;
        for (let i = 0; i < TABLEAU; i++) {
            for (let j = 0; j < i+1; j++) {
                this._tableau[i].push(this._deck.cards[ix]);
                ix++;
            }
            this._tableau[i].last.enableDrag();
        }

        // add remaining card on stock
        for (ix; ix < this._deck.cards.length; ix++) {
            this._stock.push(this._deck.cards[ix]);
        }
        this._stock.last.enable();
        this._stock.on('tap', this._onTapStock, this);
    }

    _onDragStop (event) {
        let card = event.currentTarget;
        let pile = this._hitTest(card);
        if (pile) {
            if (pile.handle(card)) {
                card.pile.pop(card);
                pile.push(card);
                return;
            }
        }

        card.cancel();
    }

    _onDragMove (event) {
        let card = event.currentTarget;
        let pile = this._hitTest(card);
        if (pile) {
            pile.debug(true);
        }
    }

    _onTapStock (event) {
        if (this._stock.last) {
            let card = event.target;
            this._stock.pop(card);
            this._waste.push(card);
        } else {
            let card = this._waste.last;
            while (card) {
                this._waste.pop(card);
                this._stock.push(card);
                card = this._waste.last;
            }
        }
    }

    _hitTest (card) {
        let col, row;

        for (let i = 0; i < FOUNDATION; i++) {
            this._foundation[i].debug(false);
        }

        for (let i = 0; i < TABLEAU; i++) {
            this._tableau[i].debug(false);
        }

        col = Math.round((card.x - this._foundation[0].x) / 100);
        row = Math.round((card.y - this._foundation[0].y) / 95);
        if (col > -1 && col < FOUNDATION && row === 0) {
            return this._foundation[col];
        } else {
            col = Math.round((card.x - this._tableau[0].x) / 100);
            row = Math.round((card.y - this._tableau[0].y) / 95);
            if (col > -1 && col < TABLEAU && row > -1) {
                return this._tableau[col];
            }
        }

        return;
    }
}

let game = new Game(700, 600);
game.load();