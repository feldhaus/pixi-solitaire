const LANDSCAPE_COLS = 9;
const LANDSCAPE_ROWS = 4;
const PORTRAID_COLS = 7;

import { CARD_WIDTH, CARD_HEIGHT } from './card';

export class Layout {
    static landscapeMode (width, height) {
        this.cols = LANDSCAPE_COLS;
        this.rows = LANDSCAPE_ROWS;

        const newHeight = height / this.rows;

        Layout.cardSize.y = newHeight * 0.8;
        Layout.cardSize.x = CARD_WIDTH * Layout.cardSize.y / CARD_HEIGHT;

        Layout.margin.x = (width - Layout.cardSize.x * this.cols) / this.cols;
        Layout.margin.y = newHeight * 0.2;

        Layout.padding.x = Layout.margin.x / 2;
        Layout.padding.y = Layout.margin.y / 2;

        Layout.cardArea.x = Layout.cardSize.x + Layout.margin.x;
        Layout.cardArea.y = Layout.cardSize.y + Layout.margin.y;
    }

    static portraidMode (width) {
        this.cols = PORTRAID_COLS;

        const newWidth = width / this.cols;
        
        Layout.cardSize.x = newWidth * 0.8;
        Layout.cardSize.y = CARD_HEIGHT * Layout.cardSize.x / CARD_WIDTH;

        Layout.margin.x = newWidth * 0.2;
        Layout.margin.y = Layout.margin.x;

        Layout.padding.x = Layout.margin.x / 2;
        Layout.padding.y = Layout.margin.y / 2;

        Layout.cardArea.x = Layout.cardSize.x + Layout.margin.x;
        Layout.cardArea.y = Layout.cardSize.y + Layout.margin.y;
    }
}

Layout.cols = 0;
Layout.rows = 0;
Layout.cardSize = {x: 0, y: 0};
Layout.cardArea = {x: 0, y: 0};
Layout.padding =  {x: 0, y: 0};
Layout.margin =   {x: 0, y: 0};