/* eslint-disable max-classes-per-file */
import {
  Container, Graphics, Point, Sprite, Texture,
} from 'pixi.js';
import { TweenLite } from 'gsap';
import { RANKS, CARD_HEIGHT } from './card';

export class Pile extends Container {
  constructor() {
    super();

    this.cards = [];
    this.offset = new Point(0, 0);

    this.highlightSprite = new Sprite(Texture.WHITE);
    this.addChild(this.highlightSprite);
    this.highlightSprite.alpha = 0.5;
    this.highlightSprite.visible = false;

    this.frame = new Graphics();
    this.addChild(this.frame);
  }

  push(card) {
    let newCard = card;
    do {
      this.cards.push(newCard);
      this.tweenToTop();
      this.listen(newCard);
      newCard.bringFoward();
      newCard.pile = this;
      newCard = newCard.tail;
    }
    while (newCard);
  }

  removeAll() {
    for (let i = this.cards.length - 1; i >= 0; i -= 1) {
      this.unlisten(this.cards[i]);
      this.cards[i].pile = null;
      this.cards[i].tail = null;
    }
    this.cards = [];
  }

  pop(card) {
    if (card) {
      const removedCards = this.cards.splice(this.cards.indexOf(card));
      for (let i = 0; i < removedCards.length; i += 1) {
        this.unlisten(removedCards[i]);
        removedCards[i].pile = null;
      }
    } else {
      const lastCard = this.cards.pop();
      this.unlisten();
      lastCard.pile = null;
    }
    if (this.last) {
      this.last.tail = null;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  handle() {
    return false;
  }

  indexOf(card) {
    return this.cards.indexOf(card);
  }

  getCardByIndex(index) {
    return this.cards[index];
  }

  highlight(visible) {
    this.highlightSprite.visible = visible;
  }

  resize(width, height) {
    this.frame.clear();
    this.frame.lineStyle(2, 0, 0.2);
    this.frame.drawRect(-1, -1, width + 2, height + 2);

    this.highlightSprite.width = width + 10;
    this.highlightSprite.height = height + 10;
    this.highlightSprite.x = -5;
    this.highlightSprite.y = -5;

    this.arrange();
  }

  tweenToTop() {
    const len = this.length - 1;
    const end = new Point(
      this.x + this.offset.x * len,
      this.y + this.offset.y * len,
    );
    const dist = Math.sqrt((end.x - this.last.x) ** 2 + (end.y - this.last.y) ** 2);
    TweenLite.to(this.last, dist / 1000, { x: end.x, y: end.y });
  }

  arrange() {
    if (this.length === 0) return;

    const len = this.length;
    for (let i = 0; i < len; i += 1) {
      this.cards[i].x = this.x + this.offset.x * i;
      this.cards[i].y = this.y + this.offset.y * i;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  listen() {}

  // eslint-disable-next-line class-methods-use-this
  unlisten() {}

  get length() {
    return this.cards.length;
  }

  get last() {
    return this.cards[this.cards.length - 1];
  }
}

export class PileTableau extends Pile {
  pop(card) {
    super.pop(card);
    if (this.last) {
      this.last.enableDrag();
    }
  }

  handle(card) {
    if (this.last) {
      const prev = RANKS.indexOf(this.last.rank) - 1;
      if (prev > -1) {
        return this.last.color !== card.color && card.rank === RANKS[prev];
      }
      return false;
    }
    return card.rank === 'K';
  }

  resize(width, height) {
    this.offset.y = (35 / CARD_HEIGHT) * height;
    super.resize(width, height);
  }

  listen(card) {
    card.on('dragstart', this.onStartDrag, this);
  }

  unlisten(card) {
    card.removeListener('dragstart', this.onStartDrag, this);
  }

  onStartDrag(event) {
    const card = event.target;
    let i = this.cards.indexOf(card);
    for (i; i < this.length - 1; i += 1) {
      this.cards[i].tail = this.cards[i + 1];
    }
  }
}

export class PileFoundation extends Pile {
  handle(card) {
    if (card.tail) return false;
    if (this.last) {
      const next = RANKS.indexOf(this.last.rank) + 1;
      if (next < RANKS.length) {
        return this.last.suit === card.suit && card.rank === RANKS[next];
      }
      return false;
    }
    return card.rank === 'A';
  }
}

export class PileStock extends Pile {
  constructor() {
    super();

    this.interactive = true;
    this.buttonMode = true;

    this.offset.x = 0.2;
    this.offset.y = 0.2;

    this.area = new Sprite(Texture.WHITE);
    this.area.alpha = 0;
    this.addChild(this.area);
  }

  push(card) {
    super.push(card);
    card.disableDrag();
  }

  resize(width, height) {
    super.resize(width, height);
    this.area.width = width;
    this.area.height = height;
  }
}

export class PileWaste extends Pile {
  push(card) {
    if (this.last) {
      this.last.disable();
    }
    super.push(card);
    card.enableDrag();
  }

  pop(card) {
    super.pop(card);
    this.arrange();
    if (this.last) {
      this.last.enableDrag();
    }
  }

  resize(width, height, type) {
    if (type === 'horizontal') {
      this.offset.x = (30 / CARD_HEIGHT) * height;
      this.offset.y = 0;
    } else {
      this.offset.x = 0;
      this.offset.y = (50 / CARD_HEIGHT) * height;
    }
    super.resize(width, height);
  }

  tweenToTop() {
    if (this.length === 0) return;

    const len = this.length;
    const max = Math.min(len, 3);
    const end = new Point();

    for (let i = 0; i < len; i += 1) {
      if (i < len - 3) {
        end.x = this.x;
        end.y = this.y;
      } else {
        end.x = this.x + this.offset.x * (max - (len - i));
        end.y = this.y + this.offset.y * (max - (len - i));
      }
      const dist = Math.sqrt((end.x - this.cards[i].x) ** 2 + (end.y - this.cards[i].y) ** 2);
      TweenLite.to(this.cards[i], dist / 1000, { x: end.x, y: end.y });
    }
  }

  arrange() {
    if (this.length === 0) return;

    const len = this.length;
    const max = Math.min(len, 3);

    for (let i = 0; i < len; i += 1) {
      if (i < len - 3) {
        this.cards[i].x = this.x;
        this.cards[i].y = this.y;
      } else {
        this.cards[i].x = this.x + this.offset.x * (max - (len - i));
        this.cards[i].y = this.y + this.offset.y * (max - (len - i));
      }
    }
  }
}
