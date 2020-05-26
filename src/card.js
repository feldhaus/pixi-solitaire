import {
  Container, Point, Sprite, Texture,
} from 'pixi.js';
import { Suits } from './suits';

export const CARD_WIDTH = 140;
export const CARD_HEIGHT = 190;

export class Card extends Container {
  constructor(suit, rank) {
    super();

    this.suit = suit;
    this.rank = rank;

    // color is based on suit: 0 - black / 1 - red
    this.color = suit === Suits.DIAMONDS || suit === Suits.HEARTS;

    this.faceUp = false;
    this.pile = null;

    // interactive and drag stuffs
    this.interactive = false;
    this.buttonMode = false;

    this.dragStartPosition = new Point();
    this.dragOffset = new Point();
    this.isDragging = false;

    // load the back card texture just once
    if (Card.backTexture === undefined) {
      Card.backTexture = Texture.from('cardBack_blue4.png');
    }

    // create and add back sprite
    this.back = new Sprite(Card.backTexture);
    this.addChild(this.back);

    // create and add front sprite
    const frame = ['card', this.suit.name, this.rank, '.png'].join('');
    // eslint-disable-next-line new-cap
    this.front = new Sprite.from(frame);
    this.front.visible = false;
    this.addChild(this.front);
  }

  move(x, y) {
    if (this.tail) {
      const dist = this.tail.y - this.y;
      this.tail.move(x, y + dist);
    }
    this.position.set(x, y);
  }

  bringFoward() {
    this.parent.addChild(this);
    if (this.tail) {
      this.tail.bringFoward();
    }
  }

  flipUp() {
    this.faceUp = true;
    this.back.visible = false;
    this.front.visible = true;
  }

  flipDown() {
    this.faceUp = false;
    this.back.visible = true;
    this.front.visible = false;
  }

  enable() {
    this.interactive = true;
    this.buttonMode = true;
  }

  disable() {
    this.interactive = false;
    this.buttonMode = false;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  enableDrag() {
    this.enable();
    this.flipUp();
    this.on('pointerdown', this.onDragStart, this)
      .on('pointerup', this.onDragStop, this)
      .on('pointerupoutside', this.onDragStop, this)
      .on('pointermove', this.onDragMove, this);
  }

  disableDrag() {
    this.disable();
    this.flipDown();
    this.off('pointerdown', this.onDragStart, this)
      .off('pointerup', this.onDragStop, this)
      .off('pointerupoutside', this.onDragStop, this)
      .off('pointermove', this.onDragMove, this);
  }

  cancel() {
    this.move(this.dragStartPosition.x, this.dragStartPosition.y);
  }

  toString() {
    return this.rank + this.suit.unicode;
  }

  onDragStart(event) {
    this.moved = false;
    this.isDragging = true;
    this.dragStartPosition = this.position.clone();
    this.emit('dragstart', event);

    const position = event.data.getLocalPosition(this.parent);
    this.dragOffset.set(position.x - this.x, position.y - this.y);
    this.bringFoward();
  }

  onDragMove(event) {
    if (this.isDragging) {
      this.moved = true;
      const position = event.data.getLocalPosition(this.parent);
      this.move(position.x - this.dragOffset.x, position.y - this.dragOffset.y);
      this.emit('dragmove', event);
    }
  }

  onDragStop(event) {
    if (this.isDragging) {
      this.isDragging = false;
      this.emit('dragstop', event);
    }
  }

  set dragging(value) {
    this.isDragging = value;
    if (this.isDragging) {
      this.front.tint = 0xaaaaaa;
    } else {
      this.front.tint = 0xffffff;
    }
  }
}
