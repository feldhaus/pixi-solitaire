import {
  Application, Loader, Sprite, Texture, Text,
} from 'pixi.js';
import Signal from 'mini-signals';
import { Deck } from './deck';
import {
  PileTableau, PileFoundation, PileStock, PileWaste,
} from './pile';
import { Ranks } from './ranks';
import { HUD_HEIGHT, setupLayout } from './layout';

const TABLEAU = 7;
const FOUNDATION = 4;
const FONT_STYLE = {
  fontSize: 20,
  fontFamily: 'Courier New',
  fill: 0xffffff,
};

export class Game {
  constructor(width, height) {
    // instantiate app
    this.app = new Application({
      width,
      height,
      backgroundColor: 0x46963c,
      antialias: true,
      resolution: devicePixelRatio,
      autoDensity: true,
    });
    document.body.appendChild(this.app.view);

    // loader
    this.loader = new Loader();
    this.loader.add('cards', './assets/cards.json');

    // add start signal
    this.onStart = new Signal();

    // instantiate bars and setup
    this.barL = new Sprite(Texture.WHITE);
    this.barL.tint = 0x333333;
    this.barL.alpha = 0.15;
    this.barR = new Sprite(Texture.WHITE);
    this.barR.tint = 0x333333;
    this.barR.alpha = 0.15;
    this.barR.anchor.x = 1;
    this.barT = new Sprite(Texture.WHITE);
    this.barT.tint = 0x333333;

    // init a deck
    this.deck = new Deck();

    // init the piles
    this.stock = new PileStock();
    this.waste = new PileWaste();
    this.tableau = new Array(TABLEAU).fill().map(() => new PileTableau());
    this.foundation = new Array(FOUNDATION)
      .fill()
      .map(() => new PileFoundation());

    // HUD timer
    this.timerId = undefined;
    this.timer = 0;
    this.txtTimer = new Text('0:00:00', FONT_STYLE);
    this.txtTimer.anchor.set(1, 0.5);
    this.txtTimer.y = HUD_HEIGHT * 0.5;

    // HUD score
    this.score = 0;
    this.txtScore = new Text('SCORE: 000', FONT_STYLE);
    this.txtScore.anchor.set(0, 0.5);
    this.txtScore.y = HUD_HEIGHT * 0.5;

    // buttons
    this.btnRestart = new Text('RESTART (R)', FONT_STYLE);
    this.btnRestart.anchor.set(0, 1);

    this.btnNew = new Text('NEW GAME (N)', FONT_STYLE);
    this.btnNew.anchor.set(1, 1);
  }

  load() {
    this.loader.onComplete.add(this.setup.bind(this));
    this.loader.onComplete.add(this.layout.bind(this));
    this.loader.load();
  }

  start(seed) {
    // shuffle the deck
    if (Number.isNaN(seed)) {
      this.deck.shuffle(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
    } else {
      this.deck.shuffle(seed);
    }

    this.restart();
  }

  stop() {
    clearInterval(this.timerId);
  }

  restart() {
    this.stop();

    // remove cards from piles
    this.stock.removeAll();
    this.waste.removeAll();
    this.tableau.forEach((pile) => {
      pile.removeAll();
    });
    this.foundation.forEach((pile) => {
      pile.removeAll();
    });

    // draw cards
    this.draw();

    // reset score
    this.score = 0;
    this.updateScore();

    // start count up
    this.startTimer();
  }

  resize(width, height) {
    this.app.renderer.resize(width, height);
    this.layout();
  }

  setup() {
    // add stock pile
    this.app.stage.addChild(this.stock);
    this.stock.on('pointertap', this.onTapStock, this);

    // add waste pile
    this.app.stage.addChild(this.waste);

    // add foundation piles
    this.foundation.forEach((pile) => {
      this.app.stage.addChild(pile);
    });

    // add tableu piles
    this.tableau.forEach((pile) => {
      this.app.stage.addChild(pile);
    });

    // add cards
    this.deck.create();
    this.deck.cards.forEach((card) => {
      this.app.stage.addChild(card);
      card.on('dragstop', this.onDragStop, this);
      card.on('dragmove', this.onDragMove, this);
      card.on('pointertap', this.onTapCard, this);
    });

    // add bars
    this.app.stage.addChildAt(this.barL, 0);
    this.app.stage.addChildAt(this.barR, 0);
    this.app.stage.addChildAt(this.barT, 0);

    // add HUD
    this.app.stage.addChild(this.txtTimer);
    this.app.stage.addChild(this.txtScore);

    // add buttons
    this.app.stage.addChild(this.btnRestart);
    this.btnRestart.interactive = true;
    this.btnRestart.buttonMode = true;
    this.btnRestart.on('pointerup', this.restart.bind(this));

    this.app.stage.addChild(this.btnNew);
    this.btnNew.interactive = true;
    this.btnNew.buttonMode = true;
    this.btnNew.on('pointerup', this.start.bind(this));
  }

  layout() {
    setupLayout({
      width: this.width,
      height: this.height,
      deck: this.deck,
      stock: this.stock,
      waste: this.waste,
      foundation: this.foundation,
      tableau: this.tableau,
      barLeft: this.barL,
      barRight: this.barR,
      barTop: this.barT,
      btnRestart: this.btnRestart,
      btnNew: this.btnNew,
      txtTimer: this.txtTimer,
      txtScore: this.txtScore,
    });
  }

  draw() {
    // draw cards on the tableau
    let ix = 0;
    this.tableau.forEach((pile, index) => {
      for (let i = 0; i < index + 1; i++) {
        pile.push(this.deck.cards[ix++]);
        pile.last.disableDrag();
      }
      pile.last.enableDrag();
    });

    // add remaining card to stock
    for (ix; ix < this.deck.cards.length; ix++) {
      this.stock.push(this.deck.cards[ix]);
      this.stock.last.disableDrag();
    }
  }

  onDragStop(event) {
    const card = event.currentTarget;
    const pile = this.hitTest(card);

    if (pile) {
      if (pile.handle(card)) {
        event.stopPropagation();
        this.match(card, pile);
        return;
      }
    }

    card.cancel();
  }

  onDragMove(event) {
    const card = event.currentTarget;
    const pile = this.hitTest(card);

    if (pile) {
      pile.highlight(true);
    }
  }

  onTapCard(event) {
    const card = event.currentTarget;

    if (card.moved) return;
    if (card.pile instanceof PileStock) return;

    if (card.pile instanceof PileWaste || card.pile instanceof PileTableau) {
      for (let i = 0; i < FOUNDATION; i++) {
        const pile = this.foundation[i];
        if (card.pile !== pile && pile.handle(card)) {
          event.stopPropagation();
          this.match(card, pile);
          return;
        }
      }
    }

    for (let i = 0; i < TABLEAU; i++) {
      const pile = this.tableau[i];
      if (card.pile !== pile && pile.handle(card)) {
        event.stopPropagation();
        this.match(card, pile);
        return;
      }
    }
  }

  onTapStock() {
    let card;
    if (this.stock.last) {
      card = this.stock.last;
      this.stock.pop(card);
      this.waste.push(card);
    } else {
      card = this.waste.last;
      while (card) {
        this.waste.pop(card);
        this.stock.push(card);
        card = this.waste.last;
      }
      this.addScore(-100);
    }
  }

  hitTest(card) {
    this.foundation.forEach((pile) => {
      pile.highlight(false);
    });

    this.tableau.forEach((pile) => {
      pile.highlight(false);
    });

    let col;
    let row;

    for (let i = 0; i < FOUNDATION; i++) {
      col = Math.round((card.x - this.foundation[i].x) / card.area.x);
      row = Math.round((card.y - this.foundation[i].y) / card.area.y);
      if (col === 0 && row === 0) {
        return this.foundation[i];
      }
    }

    col = Math.round((card.x - this.tableau[0].x) / card.area.x);
    row = Math.round((card.y - this.tableau[0].y) / card.area.y);
    if (col >= 0 && col < TABLEAU && row >= 0) {
      return this.tableau[col];
    }

    return null;
  }

  match(card, pile) {
    // check points
    if (pile instanceof PileFoundation) {
      this.addScore(10);
    } else {
      const ix = card.pile.indexOf(card) - 1;
      const prev = card.pile.getCardByIndex(ix);
      if ((!prev && card.rank !== Ranks.KING) || (prev && !prev.faceUp)) {
        this.addScore(5);
      }
    }

    // move card to another pile
    card.pile.pop(card);
    pile.push(card);

    // check if it's the end
    this.checkVictory();
  }

  addScore(score) {
    this.score = Math.max(0, this.score + score);
    this.updateScore();
  }

  startTimer() {
    // reset timer and score
    this.timer = 0;
    this.updateTimer();

    // start count up
    this.timerId = setInterval(() => {
      this.timer++;
      this.updateTimer();
    }, 1000);
  }

  updateTimer() {
    const h = Math.floor(this.timer / 3600);
    const m = `0${Math.floor(this.timer / 60) % 60}`.slice(-2);
    const s = `0${this.timer % 60}`.slice(-2);
    this.txtTimer.text = `${h}:${m}:${s}`;
  }

  updateScore() {
    this.txtScore.text = `SCORE: ${`000${this.score}`.slice(-3)}`;
  }

  checkVictory() {
    const sum = this.foundation.reduce(
      (a, c) => a + (c.last && c.last.rank === Ranks.KING ? 1 : 0),
      0,
    );
    if (sum === FOUNDATION) {
      // eslint-disable-next-line no-console
      console.log('WIN');
      this.stop();
    }
  }

  get width() {
    return this.app.renderer.width / this.app.renderer.resolution;
  }

  get height() {
    return this.app.renderer.height / this.app.renderer.resolution;
  }
}
