import seedrandom from 'seedrandom';
import { Card, SUITS, RANKS } from './card';

export class Deck {
  constructor() {
    this.defaultCards = [];
    this.shuffledCards = [];
    this.seed = 0;
  }

  create() {
    SUITS.forEach((suit) => {
      RANKS.forEach((rank) => {
        this.defaultCards.push(new Card(suit, rank));
      });
    });

    // clone cards array
    this.shuffledCards = this.defaultCards.concat();
  }

  shuffle(seed) {
    if (!Number.isNaN(seed)) {
      this.seed = seed;
    }

    const rng = seedrandom(this.seed);

    let currentIndex = this.defaultCards.length;
    let temporaryValue; let
      randomIndex;

    // clone cards array
    this.shuffledCards = this.defaultCards.concat();

    while (currentIndex > 0) {
      // get a random card
      randomIndex = Math.floor(rng() * currentIndex);
      currentIndex--;

      // and swap it with the current element
      temporaryValue = this.shuffledCards[currentIndex];
      this.shuffledCards[currentIndex] = this.shuffledCards[randomIndex];
      this.shuffledCards[randomIndex] = temporaryValue;
    }
  }

  get cards() {
    return this.shuffledCards;
  }
}
