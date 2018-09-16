import { Card, SUITS, RANKS } from './card';

export class Deck {
    constructor () {
        this._cards = [];
        this._seed = 0;
    }

    create () {
        SUITS.forEach(suit => {
            RANKS.forEach(rank => {
                this._cards.push(new Card(suit, rank));
            });
        });
    }

    shuffle (seed) {
        this._seed = seed || 0;

        let currentIndex = this._cards.length;
        let temporaryValue, randomIndex;

        while (currentIndex > 0) {
            // get a random card
            randomIndex = Math.floor(this.random() * currentIndex);
            currentIndex -= 1;

            // and swap it with the current element
            temporaryValue = this._cards[currentIndex];
            this._cards[currentIndex] = this._cards[randomIndex];
            this._cards[randomIndex] = temporaryValue;
        }
    }

    random () {
        let x = Math.sin(this._seed++) * 10000;
        return x - Math.floor(x);
    }

    get cards () {
        return this._cards;
    }
}
