import { Card, SUITS, RANKS } from './card';

export class Deck {
    constructor () {
        this._cards = [];
        this._shuffled = [];
        this._seed = 0;
    }

    create () {
        SUITS.forEach(suit => {
            RANKS.forEach(rank => {
                this._cards.push(new Card(suit, rank));
            });
        });

        // clone cards array
        this._shuffled = this._cards.concat();
    }

    shuffle (seed) {
        if (isNaN(seed)) {
            seed = this._seed;
        } else {
            this._seed = seed;
        }

        let currentIndex = this._cards.length;
        let temporaryValue, randomIndex;

        // clone cards array
        this._shuffled = this._cards.concat();

        while (currentIndex > 0) {
            // get a random card
            randomIndex = Math.floor(this._random() * currentIndex);
            currentIndex -= 1;

            // and swap it with the current element
            temporaryValue = this._shuffled[currentIndex];
            this._shuffled[currentIndex] = this._shuffled[randomIndex];
            this._shuffled[randomIndex] = temporaryValue;
        }

        this._seed = seed;
    }

    _random () {
        const x = Math.sin(this._seed++) * 10000;
        return x - Math.floor(x);
    }

    get cards () {
        return this._shuffled;
    }
}
