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
        this._build();
    }

    _setup () {
        this._deck.create();
        this._deck.cards.forEach(card => {
            this.app.stage.addChild(card);
            // card
            //     .on('pointerdown', this._onDragStart.bind(this))
            //     .on('pointerup', this._onDragStop.bind(this))
            //     .on('pointerupoutside', this._onDragStop.bind(this))
            //     .on('pointermove', this._onDragMove.bind(this));
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

    _build () {
        this._deck.shuffle(777);
        this._deck.cards.forEach(card => {
            card.on('dragstop', this._onDragStop, this);
        });

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

        let i = Math.round((card.x) / 100);
        let l = this._tableau[i].last;
        if ((l === undefined && card.rank === 'K') || l.color !== card.color) {
            card.pile.pop(card);
            this._tableau[i].push(card);
            return;
        }

        card.cancel();
    }

    _onTapStock (event) {
        let card = event.target;
        this._stock.pop(card);
        this._waste.push(card);
    }
}

let game = new Game(800, 600);
game.load();