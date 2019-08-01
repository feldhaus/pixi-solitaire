import { Card, SUITS, RANKS } from './card';
import seedrandom from 'seedrandom';

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
        }

        this._seed = seed;
        const rng = seedrandom(this._seed);

        let currentIndex = this._cards.length;
        let temporaryValue, randomIndex;

        // clone cards array
        this._shuffled = this._cards.concat();

        while (currentIndex > 0) {
            // get a random card
            randomIndex = Math.floor(rng() * currentIndex);
            currentIndex -= 1;

            // and swap it with the current element
            temporaryValue = this._shuffled[currentIndex];
            this._shuffled[currentIndex] = this._shuffled[randomIndex];
            this._shuffled[randomIndex] = temporaryValue;
        }
    }

    get cards () {
        return this._shuffled;
    }
}
