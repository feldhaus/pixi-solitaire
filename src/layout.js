
import { CARD_WIDTH, CARD_HEIGHT } from './card';

const LANDSCAPE_COLS = 9;
const LANDSCAPE_ROWS = 4;
const PORTRAIT_COLS = 7;

export const HUD_HEIGHT = 60;

function setupDeck({ deck, cardSize, cardArea }) {
  deck.cards.forEach((card) => {
    card.resize(cardSize.width, cardSize.height);
    card.area.copyFrom(cardArea);
  });
}

export function setupLandscape({
  width,
  height,
  deck,
  stock,
  waste,
  foundation,
  tableau,
  barLeft,
  barRight,
  barTop,
  btnRestart,
  btnNew,
}) {
  const cols = LANDSCAPE_COLS;
  const rows = LANDSCAPE_ROWS;
  const newHeight = (height - HUD_HEIGHT) / rows;
  const cardHeight = newHeight * 0.8;
  const cardSize = {
    width: (CARD_WIDTH * cardHeight) / CARD_HEIGHT,
    height: cardHeight,
  };
  const margin = {
    x: (width - cardSize.width * cols) / cols,
    y: newHeight * 0.2,
  };
  const padding = {
    x: margin.x * 0.5,
    y: margin.y * 0.5,
  };
  const cardArea = {
    x: cardSize.width + margin.x,
    y: cardSize.height + margin.y,
  };

  setupDeck({ deck, cardSize, cardArea });

  // position and resize stock pile
  stock.position.set(padding.x, padding.y + HUD_HEIGHT);
  stock.resize(cardSize.width, cardSize.height);

  // position and resize waste pile
  waste.position.set(
    padding.x,
    padding.y + cardArea.y + HUD_HEIGHT,
  );
  waste.resize(cardSize.width, cardSize.height, 'vertical');

  // position and resize foundation piles
  foundation.forEach((pile, index) => {
    pile.position.set(
      padding.x + (cols - 1) * cardArea.x,
      padding.y + index * cardArea.y + HUD_HEIGHT,
    );
    pile.resize(cardSize.width, cardSize.height);
  });

  // position and resize tableau piles
  tableau.forEach((pile, index) => {
    pile.position.set(
      padding.x + (index + 1) * cardArea.x,
      padding.y + HUD_HEIGHT,
    );
    pile.resize(cardSize.width, cardSize.height);
  });

  barLeft.visible = true;
  barLeft.width = cardArea.x;
  barLeft.height = height;
  barRight.visible = true;
  barRight.x = width;
  barRight.width = cardArea.x;
  barRight.height = height;
  barTop.width = width;
  barTop.height = HUD_HEIGHT;

  btnRestart.position.set(cardArea.x + 10, height - 10);
  btnNew.position.set(width - cardArea.x - 10, height - 10);
}

export function setupPortrait({
  width,
  height,
  deck,
  stock,
  waste,
  foundation,
  tableau,
  barLeft,
  barRight,
  barTop,
  btnRestart,
  btnNew,
}) {
  const cols = PORTRAIT_COLS;
  const newWidth = width / cols;
  const cardWidth = newWidth * 0.8;
  const cardSize = {
    width: cardWidth,
    height: (CARD_HEIGHT * cardWidth) / CARD_WIDTH,
  };
  const margin = {
    x: newWidth * 0.2,
    y: newWidth * 0.2,
  };
  const padding = {
    x: margin.x * 0.5,
    y: margin.y * 0.5,
  };
  const cardArea = {
    x: cardSize.width + margin.x,
    y: cardSize.height + margin.y,
  };

  setupDeck({ deck, cardSize, cardArea });

  // position and resize stock pile
  stock.position.set(padding.x, padding.y + HUD_HEIGHT);
  stock.resize(cardSize.width, cardSize.height);

  // position and resize waste pile
  waste.position.set(
    padding.x + cardArea.x,
    padding.y + HUD_HEIGHT,
  );
  waste.resize(cardSize.width, cardSize.height, 'horizontal');

  // position and resize foundation piles
  foundation.forEach((pile, index) => {
    pile.position.set(
      padding.x + (3 + index) * cardArea.x,
      padding.y + HUD_HEIGHT,
    );
    pile.resize(cardSize.width, cardSize.height);
  });

  // position and resize tableau piles
  tableau.forEach((pile, index) => {
    pile.position.set(
      padding.x + index * cardArea.x,
      padding.y + cardArea.y + HUD_HEIGHT,
    );
    pile.resize(cardSize.width, cardSize.height);
  });

  barLeft.visible = false;
  barRight.visible = false;
  barTop.width = width;
  barTop.height = HUD_HEIGHT;

  btnRestart.position.set(10, height - 10);
  btnNew.position.set(width - 10, height - 10);
}

export function setupLayout({
  width,
  height,
  deck,
  stock,
  waste,
  foundation,
  tableau,
  barLeft,
  barRight,
  barTop,
  btnRestart,
  btnNew,
  txtTimer,
  txtScore,
}) {
  const ratio = width / height;
  const options = {
    width,
    height,
    deck,
    stock,
    waste,
    foundation,
    tableau,
    barLeft,
    barRight,
    barTop,
    btnRestart,
    btnNew,
  };

  if (ratio > 1.6) {
    setupLandscape(options);
  } else {
    setupPortrait(options);
  }

  txtTimer.x = width * 0.5 - 10;
  txtScore.x = width * 0.5 + 10;
}
