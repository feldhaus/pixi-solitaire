import * as PIXI from 'pixi.js';

import { Deck } from './deck';
import { PileTableau, PileFoundation, PileStock, PileWaste } from './pile';
import { CARD_WIDTH, CARD_HEIGHT } from './card';

const TABLEAU = 7;
const FOUNDATION = 4;

export class Game {
    constructor (width, height) {
        // instantiate app
        this._app = new PIXI.Application(width, height, { backgroundColor: 0x46963c, antialias: true });
        document.body.appendChild(this._app.view);

        // game is loaded
        this._loaded = false;

        // space between cards
        this._cardSpace = new PIXI.Point(CARD_WIDTH, CARD_HEIGHT);

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

    resize (width, height) {
        this._app.renderer.resize(width, height);

        if (this._loaded) {
            this._layout();
        }
    }

    _onAssetsLoaded () {
        this._setup();
        this._layout();
        this._deal();
        this._loaded = true;
    }

    _setup () {
        // add cards
        this._deck.create();
        this._deck.cards.forEach(card => {
            this._app.stage.addChild(card);
        });

        // add stock pile
        this._app.stage.addChildAt(this._stock, 0);

        // add waste pile
        this._app.stage.addChildAt(this._waste, 0);

        // add foundation piles
        this._foundation.forEach((pile, index) => {
            this._app.stage.addChildAt(pile, 0);
        });

        // add tableu piles
        this._tableau.forEach((pile, index) => {
            this._app.stage.addChildAt(pile, 0);
        });
    }

    _layout () {
        if (this.ratio > 1.6) {
            this._landscapeMode();
        } else {
            this._portraidMode();
        }
    }

    _landscapeMode () {
        const COLS = 9;
        const ROWS = 4;

        const newHeight = this.height / ROWS;
        const maxHeight = newHeight * 0.8;
        const maxWidth = CARD_WIDTH * maxHeight / CARD_HEIGHT;
        const margin = new PIXI.Point(
            (this.width - maxWidth * COLS) / COLS,
            newHeight * 0.2
        );

        this._cardSpace.x = maxWidth + margin.x;
        this._cardSpace.y = maxHeight + margin.y;

        this._stock.resize(maxWidth, maxHeight);
        this._stock.x = margin.x / 2;
        this._stock.y = margin.y / 2;

        this._waste.x = margin.x / 2;
        this._waste.y = margin.y / 2 + this._cardSpace.y;
        this._waste.setVertical();
        this._waste.resize(maxWidth, maxHeight);

        this._foundation.forEach((pile, index) => {
            pile.resize(maxWidth, maxHeight);
            pile.x = margin.x / 2 + (COLS - 1) * this._cardSpace.x;
            pile.y = margin.y / 2 + index * this._cardSpace.y;
        });

        this._tableau.forEach((pile, index) => {
            pile.resize(maxWidth, maxHeight);
            pile.x = margin.x / 2 + (index + 1) * this._cardSpace.x;
            pile.y = margin.y / 2;
        });

        this._deck.cards.forEach(card => {
            card.resize(maxWidth, maxHeight);
        });
    }

    _portraidMode () {
        const COLS = 7;

        const newWidth = this.width / COLS;
        const margin = newWidth * 0.2;
        const maxWidth = newWidth * 0.8;
        const maxHeight = CARD_HEIGHT * maxWidth / CARD_WIDTH;

        this._cardSpace.x = maxWidth + margin;
        this._cardSpace.y = maxHeight + margin;

        this._stock.resize(maxWidth, maxHeight);
        this._stock.x = margin / 2;
        this._stock.y = margin / 2;

        this._waste.x = margin / 2 + this._cardSpace.x;
        this._waste.y = margin / 2;
        this._waste.setHorizontal();
        this._waste.resize(maxWidth, maxHeight);
        
        this._foundation.forEach((pile, index) => {
            pile.resize(maxWidth, maxHeight);
            pile.x = margin / 2 + (3 + index) * this._cardSpace.x;
            pile.y = margin / 2;
        });

        this._tableau.forEach((pile, index) => {
            pile.resize(maxWidth, maxHeight);
            pile.x = margin / 2 + index * this._cardSpace.x;
            pile.y = margin / 2 + maxHeight + margin;
        });

        this._deck.cards.forEach(card => {
            card.resize(maxWidth, maxHeight);
        });
    }

    _deal () {
        // shuffle the deck
        this._deck.shuffle(780);

        // listen to when any card is dropped
        this._deck.cards.forEach(card => {
            card.on('dragstop', this._onDragStop, this);
            card.on('dragmove', this._onDragMove, this);
            card.on('pointertap', this._onTapCard, this);
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
        const card = event.currentTarget;
        const pile = this._hitTest(card);

        if (pile) {
            if (pile.handle(card)) {
                card.pile.pop(card);
                pile.push(card);
                event.stopPropagation();
                this._checkVictory();
                return;
            }
        }

        card.cancel();
    }

    _onDragMove (event) {
        const card = event.currentTarget;
        const pile = this._hitTest(card);

        if (pile) {
            pile.debug(true);
        }
    }

    _onTapCard (event) {
        const card = event.currentTarget;

        if (card.moved) {
            return;
        }
    
        if (card.pile instanceof PileStock) {
            return;
        }

        let pile;
        if (card.pile instanceof PileWaste || card.pile instanceof PileTableau) {
            for (let i = 0; i < FOUNDATION; i++) {
                pile = this._foundation[i];
                if (card.pile !== pile && pile.handle(card)) {
                    card.pile.pop(card);
                    pile.push(card);
                    event.stopPropagation();
                    this._checkVictory();
                    return;
                }
            }
        }

        for (let i = 0; i < TABLEAU; i++) {
            pile = this._tableau[i];
            if (card.pile !== pile && pile.handle(card)) {
                card.pile.pop(card);
                pile.push(card);
                event.stopPropagation();
                return; 
            }
        }
    }

    _onTapStock (event) {
        let card;
        if (this._stock.last) {
            card = event.target;
            this._stock.pop(card);
            this._waste.push(card);
        } else {
            card = this._waste.last;
            while (card) {
                this._waste.pop(card);
                this._stock.push(card);
                card = this._waste.last;
            }
        }
    }

    _hitTest (card) {
        for (let i = 0; i < FOUNDATION; i++) {
            this._foundation[i].debug(false);
        }

        for (let i = 0; i < TABLEAU; i++) {
            this._tableau[i].debug(false);
        }

        let col = Math.round((card.x - this._foundation[0].x) / this._cardSpace.x);
        let row = Math.round((card.y - this._foundation[0].y) / this._cardSpace.y);

        if (col > -1 && col < FOUNDATION && row === 0) {
            return this._foundation[col];
        } else {
            col = Math.round((card.x - this._tableau[0].x) / this._cardSpace.x);
            row = Math.round((card.y - this._tableau[0].y) / this._cardSpace.y);
            if (col > -1 && col < TABLEAU && row > -1) {
                return this._tableau[col];
            }
        }

        return;
    }

    _checkVictory () {
        const sum = this._foundation.reduce((a, c) => {
            return a + ((c.last && c.last.rank === 'K') ? 1 : 0)
        }, 0);
        if (sum === FOUNDATION) {
            console.log('WIN');
        }
    }

    get width () {
        return this._app.renderer.width;
    }

    get height () {
        return this._app.renderer.height;
    }

    get ratio () {
        return this.width / this.height;
    }
}

window.onload = () => {
    // instantiate a game
    const game = new Game(window.innerWidth, window.innerHeight);

    // load game
    game.load();

    // when resize window wait 500 miliseconds until resize the game
    let timeoutId = null;
    window.addEventListener('resize', () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            game.resize(window.innerWidth, window.innerHeight)
            timeoutId = null;
        }, 500);
    });
}