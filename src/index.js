import * as PIXI from 'pixi.js';
import Signal from 'mini-signals';

import { Deck } from './deck';
import { PileTableau, PileFoundation, PileStock, PileWaste } from './pile';
import { Layout } from './layout';

const TABLEAU = 7;
const FOUNDATION = 4;
const HUD_HEIGHT = 60;
const FONT_STYLE = {
    fontSize: 20,
    fontFamily: 'Courier New',
    fill: 0xffffff
};

export class Game {
    constructor (width, height) {
        // instantiate app
        this._app = new PIXI.Application(width, height, {
            backgroundColor: 0x46963c,
            antialias: true,
        });
        document.body.appendChild(this._app.view);

        // loader
        this._loader = PIXI.loader.add('cards', './assets/cards.json');

        // instantiate bars and setup
        this._barL = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._barL.tint = 0x333333;
        this._barL.alpha = 0.15;
        this._barR = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._barR.tint = 0x333333;
        this._barR.alpha = 0.15;
        this._barR.anchor.x = 1;
        this._barT = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._barT.tint = 0x333333;

        // init a deck
        this._deck = new Deck();

        // init the piles
        this._stock = new PileStock();
        this._waste = new PileWaste();
        this._tableau = new Array(TABLEAU).fill().map(() => new PileTableau());
        this._foundation = new Array(FOUNDATION).fill().map(() => new PileFoundation());

        // HUD timer
        this._timerId = undefined;
        this._timer = 0;
        this._txtTimer = new PIXI.Text('0:00:00', FONT_STYLE);
        this._txtTimer.anchor.set(1, 0.5);
        this._txtTimer.y = HUD_HEIGHT / 2;

        // HUD score
        this._score = 0;
        this._txtScore = new PIXI.Text('SCORE: 000', FONT_STYLE);
        this._txtScore.anchor.set(0, 0.5);
        this._txtScore.y = HUD_HEIGHT / 2;

        // new game button
        this._btnNew = new PIXI.Text('NEW GAME', FONT_STYLE);
        this._btnNew.anchor.set(1, 1);
        this.onStart = new Signal();
    }

    load () {
        this._loader.onComplete.add(this._setup.bind(this));
        this._loader.onComplete.add(this._layout.bind(this));
        this._loader.load();
    }

    start (seed) {
        if (isNaN(seed)) {
            seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        }

        // shuffle the deck
        this._deck.shuffle(seed);

        this.restart();
    }

    stop () {
        clearInterval(this._timerId);
    }

    restart () {
        this.stop();

        // remove cards from piles
        this._stock.removeAll();
        this._waste.removeAll();
        this._tableau.forEach(pile => { pile.removeAll(); });
        this._foundation.forEach(pile => { pile.removeAll(); });

        // draw cards
        this._draw();

        // reset score
        this._score = 0;
        this._updateScore();

        // start count up
        this._startTimer();
    }

    resize (width, height) {
        this._app.renderer.resize(width, height);
        this._layout();
    }

    _setup () {
        // add stock pile
        this._app.stage.addChild(this._stock);
        this._stock.on('pointertap', this._onTapStock, this);

        // add waste pile
        this._app.stage.addChild(this._waste);

        // add foundation piles
        this._foundation.forEach(pile => {
            this._app.stage.addChild(pile);
        });

        // add tableu piles
        this._tableau.forEach(pile => {
            this._app.stage.addChild(pile);
        });

        // add cards
        this._deck.create();
        this._deck.cards.forEach(card => {
            this._app.stage.addChild(card);
            card.on('dragstop', this._onDragStop, this);
            card.on('dragmove', this._onDragMove, this);
            card.on('pointertap', this._onTapCard, this);
        });

        // add bars
        this._app.stage.addChildAt(this._barL, 0);
        this._app.stage.addChildAt(this._barR, 0);
        this._app.stage.addChildAt(this._barT, 0);

        // add HUD
        this._app.stage.addChild(this._txtTimer);
        this._app.stage.addChild(this._txtScore);

        // add new game button
        this._app.stage.addChild(this._btnNew);
        this._btnNew.interactive = true;
        this._btnNew.buttonMode = true;
        this._btnNew.on('pointerup', () => {
            this.onStart.dispatch(this);
        });
    }

    _layout () {
        if (this.ratio > 1.6) {
            this._landscapeMode();
        } else {
            this._portraidMode();
        }

        // position HUD values
        this._txtTimer.x = this.width / 2 - 10;
        this._txtScore.x = this.width / 2 + 10;
    }

    _landscapeMode () {
        Layout.landscapeMode(this.width, this.height - HUD_HEIGHT);

        // resize all cards
        this._deck.cards.forEach(card => {
            card.resize(Layout.cardSize.x, Layout.cardSize.y);
        });

        // position and resize stock pile
        this._stock.position.set(
            Layout.padding.x,
            Layout.padding.y + HUD_HEIGHT
        );
        this._stock.resize(Layout.cardSize.x, Layout.cardSize.y);

        // position and resize waste pile
        this._waste.position.set(
            Layout.padding.x,
            Layout.padding.y + Layout.cardArea.y + HUD_HEIGHT
        );
        this._waste.resize(Layout.cardSize.x, Layout.cardSize.y, 'vertical');

        // position and resize foundation piles
        this._foundation.forEach((pile, index) => {
            pile.position.set(
                Layout.padding.x + (Layout.cols - 1) * Layout.cardArea.x,
                Layout.padding.y + index * Layout.cardArea.y + HUD_HEIGHT
            );
            pile.resize(Layout.cardSize.x, Layout.cardSize.y);
        });

        // position and resize tableau piles
        this._tableau.forEach((pile, index) => {
            pile.position.set(
                Layout.padding.x + (index + 1) * Layout.cardArea.x,
                Layout.padding.y + HUD_HEIGHT
            );
            pile.resize(Layout.cardSize.x, Layout.cardSize.y);
        });

        // position, show and resize the bars
        this._barL.visible = true;
        this._barL.width = Layout.cardArea.x;
        this._barL.height = this.height;
        this._barR.visible = true;
        this._barR.x = this.width;
        this._barR.width = Layout.cardArea.x;
        this._barR.height = this.height;
        this._barT.width = this.width;
        this._barT.height = HUD_HEIGHT;

        // position button new game
        this._btnNew.position.set(
            this.width - this._barR.width - 10,
            this.height - 10
        );
    }

    _portraidMode () {
        Layout.portraidMode(this.width);

        // resize all cards
        this._deck.cards.forEach(card => {
            card.resize(Layout.cardSize.x, Layout.cardSize.y);
        });

        // position and resize stock pile
        this._stock.position.set(
            Layout.padding.x,
            Layout.padding.y + HUD_HEIGHT
        );
        this._stock.resize(Layout.cardSize.x, Layout.cardSize.y);

        // position and resize waste pile
        this._waste.position.set(
            Layout.padding.x + Layout.cardArea.x,
            Layout.padding.y + HUD_HEIGHT
        );
        this._waste.resize(Layout.cardSize.x, Layout.cardSize.y, 'horizontal');

        // position and resize foundation piles
        this._foundation.forEach((pile, index) => {
            pile.position.set(
                Layout.padding.x + (3 + index) * Layout.cardArea.x,
                Layout.padding.y + HUD_HEIGHT
            );
            pile.resize(Layout.cardSize.x, Layout.cardSize.y);
        });

        // position and resize tableau piles
        this._tableau.forEach((pile, index) => {
            pile.position.set(
                Layout.padding.x + index * Layout.cardArea.x,
                Layout.padding.y + Layout.cardArea.y + HUD_HEIGHT
            );
            pile.resize(Layout.cardSize.x, Layout.cardSize.y);
        });

        // hide lateral bars and resize the top one
        this._barL.visible = false;
        this._barR.visible = false;
        this._barT.width = this.width;
        this._barT.height = HUD_HEIGHT;

        // position button new game
        this._btnNew.position.set(this.width - 10, this.height - 10);
    }

    _draw () {
        // draw cards on the tableau
        let ix = 0;
        this._tableau.forEach((pile, index) => {
            for (let i = 0; i < index + 1; i++) {
                pile.push(this._deck.cards[ix++]);
                pile.last.disableDrag();
            }
            pile.last.enableDrag();
        });

        // add remaining card to stock
        for (ix; ix < this._deck.cards.length; ix++) {
            this._stock.push(this._deck.cards[ix]);
            this._stock.last.disableDrag();
        }
    }

    _onDragStop (event) {
        const card = event.currentTarget;
        const pile = this._hitTest(card);

        if (pile) {
            if (pile.handle(card)) {
                event.stopPropagation();
                this._match(card, pile);
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
                    event.stopPropagation();
                    this._match(card, pile);
                    return;
                }
            }
        }

        for (let i = 0; i < TABLEAU; i++) {
            const pile = this._tableau[i];
            if (card.pile !== pile && pile.handle(card)) {
                event.stopPropagation();
                this._match(card, pile);
                return; 
            }
        }
    }

    _onTapStock () {
        let card;
        if (this._stock.last) {
            card = this._stock.last;
            this._stock.pop(card);
            this._waste.push(card);
        } else {
            card = this._waste.last;
            while (card) {
                this._waste.pop(card);
                this._stock.push(card);
                card = this._waste.last;
            }
            this._addScore(-100);
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

    _match (card, pile) {
        // check points
        if (pile instanceof PileFoundation) {
            this._addScore(10);
        } else {
            const ix = card.pile.indexOf(card) - 1;
            const prev = card.pile.getCardByIndex(ix);
            if ((!prev && card.rank !== 'K') || (prev && !prev.faceUp)) {
                this._addScore(5);
            }
        }

        // move card to another pile
        card.pile.pop(card);
        pile.push(card);

        // check if it's the end
        this._checkVictory();
    }

    _addScore (score) {
        this._score = Math.max(0, this._score + score);
        this._updateScore();
    }

    _startTimer () {
        // reset timer and score
        this._timer = 0;
        this._updateTimer();

        // start count up
        this._timerId = setInterval(() => {
            this._timer++;
            this._updateTimer();
        }, 1000);
    }

    _updateTimer () {
        const h = Math.floor(this._timer / 3600);
        const m = ('0' + (Math.floor(this._timer / 60) % 60)).slice(-2);
        const s = ('0' + (this._timer % 60)).slice(-2);
        this._txtTimer.text = `${h}:${m}:${s}`;
    }

    _updateScore () {
        this._txtScore.text = 'SCORE: ' + ('000' + this._score).slice(-3);
    }

    _checkVictory () {
        const sum = this._foundation.reduce((a, c) => {
            return a + ((c.last && c.last.rank === 'K') ? 1 : 0);
        }, 0);
        if (sum === FOUNDATION) {
            // eslint-disable-next-line no-console
            console.log('WIN');
            this.stop();
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

    get loader () {
        return this._loader;
    }
}