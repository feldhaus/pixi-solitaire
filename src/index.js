import * as PIXI from 'pixi.js';

import { Deck } from './deck';
import { PileTableau, PileFoundation, PileStock, PileWaste } from './pile';
import { Layout } from './layout';

const TABLEAU = 7;
const FOUNDATION = 4;

export class Game {
    constructor (width, height) {
        // instantiate app
        this._app = new PIXI.Application(width, height, {
            backgroundColor: 0x46963c,
            antialias: true
        });
        document.body.appendChild(this._app.view);

        // game is loaded
        this._loaded = false;

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
        this._draw();
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
        this._foundation.forEach(pile => {
            this._app.stage.addChildAt(pile, 0);
        });

        // add tableu piles
        this._tableau.forEach(pile => {
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
        Layout.landscapeMode(this.width, this.height);

        // resize all cards
        this._deck.cards.forEach(card => {
            card.resize(Layout.cardSize.x, Layout.cardSize.y);
        });

        // position and resize stock pile
        this._stock.resize(Layout.cardSize.x, Layout.cardSize.y);
        this._stock.x = Layout.padding.x;
        this._stock.y = Layout.padding.y;

        // position and resize waste pile
        this._waste.resize(Layout.cardSize.x, Layout.cardSize.y, 'vertical');
        this._waste.x = Layout.padding.x;
        this._waste.y = Layout.padding.y + Layout.cardArea.y;

        // position and resize foundation piles
        this._foundation.forEach((pile, index) => {
            pile.resize(Layout.cardSize.x, Layout.cardSize.y);
            pile.x = Layout.padding.x + (Layout.cols - 1) * Layout.cardArea.x;
            pile.y = Layout.padding.y + index * Layout.cardArea.y;
        });

        // position and resize tableau piles
        this._tableau.forEach((pile, index) => {
            pile.resize(Layout.cardSize.x, Layout.cardSize.y);
            pile.x = Layout.padding.x + (index + 1) * Layout.cardArea.x;
            pile.y = Layout.padding.y;
        });
    }

    _portraidMode () {
        Layout.portraidMode(this.width, this.height);

        // resize all cards
        this._deck.cards.forEach(card => {
            card.resize(Layout.cardSize.x, Layout.cardSize.y);
        });

        // position and resize stock pile
        this._stock.resize(Layout.cardSize.x, Layout.cardSize.y);
        this._stock.x = Layout.padding.x;
        this._stock.y = Layout.padding.y;

        // position and resize waste pile
        this._waste.resize(Layout.cardSize.x, Layout.cardSize.y, 'horizontal');
        this._waste.x = Layout.padding.x + Layout.cardArea.x;
        this._waste.y = Layout.padding.y;

        // position and resize foundation piles
        this._foundation.forEach((pile, index) => {
            pile.resize(Layout.cardSize.x, Layout.cardSize.y);
            pile.x = Layout.padding.x + (3 + index) * Layout.cardArea.x;
            pile.y = Layout.padding.y;
        });

        // position and resize tableau piles
        this._tableau.forEach((pile, index) => {
            pile.resize(Layout.cardSize.x, Layout.cardSize.y);
            pile.x = Layout.padding.x + index * Layout.cardArea.x;
            pile.y = Layout.padding.y + Layout.cardArea.y;
        });
    }

    _draw () {
        // shuffle the deck
        this._deck.shuffle(780);

        // listen to when any card is dropped
        this._deck.cards.forEach(card => {
            card.on('dragstop', this._onDragStop, this);
            card.on('dragmove', this._onDragMove, this);
            card.on('pointertap', this._onTapCard, this);
        });

        // draw cards on the tableau
        let ix = 0;
        this._tableau.forEach((pile, index) => {
            for (let i = 0; i < index + 1; i++) {
                pile.push(this._deck.cards[ix++]);
            }
            pile.last.enableDrag();
        });

        // add remaining card to stock
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
            pile.highlight(true);
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

        if (card.pile instanceof PileWaste || card.pile instanceof PileTableau) {
            for (let i = 0; i < FOUNDATION; i++) {
                const pile = this._foundation[i];
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
            const pile = this._tableau[i];
            if (card.pile !== pile && pile.handle(card)) {
                card.pile.pop(card);
                pile.push(card);
                event.stopPropagation();
                return; 
            }
        };
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
        this._foundation.forEach(pile => {
            pile.highlight(false);
        });

        this._tableau.forEach(pile => {
            pile.highlight(false);
        });

        let col, row;

        for (let i = 0; i < FOUNDATION; i++) {
            col = Math.round((card.x - this._foundation[i].x) / Layout.cardArea.x);
            row = Math.round((card.y - this._foundation[i].y) / Layout.cardArea.y);
            if (col === 0 && row === 0) {
                return this._foundation[i];
            }
        }

        col = Math.round((card.x - this._tableau[0].x) / Layout.cardArea.x);
        row = Math.round((card.y - this._tableau[0].y) / Layout.cardArea.y);
        if (col >= 0 && col < TABLEAU && row >= 0) {
            return this._tableau[col];
        }
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