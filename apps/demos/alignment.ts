import {
  Alignment,
  AlignmentScope,
  At,
  Box,
  Button,
  Placement,
  Stack,
  Text,
  bold,
} from '@teaui/core'

import {demo} from './demo.js'

interface Card {
  view: Text
  size: number
}

function main() {
  // top-left of the card column; the column is as wide as its widest card
  const cardsStart = new Alignment({name: 'cards'})
  // bottom-left of the card column (a trailing marker)
  const cardsEnd = new Alignment({name: 'cards-end'})

  const cardSizes = [8, 16]
  const cards: Card[] = cardSizes.map(size => ({
    view: new Text({text: cardText(size)}),
    size,
  }))

  function cardText(size: number) {
    return DOT.repeat(size)
  }

  function resize(card: Card, delta: number) {
    card.size = Math.max(1, card.size + delta)
    card.view.text = cardText(card.size)
  }

  const content = Stack.down({
    gap: 1,
    children: [
      new Text({text: bold('Alignment points')}),
      new Text({
        wrap: true,
        text: 'This column ends two cells before the widest card. Resize the cards, and it reflows in the same render: the Placement is pinned to an Alignment marker at the top-left of the card column. No Geometry callbacks, no extra state.',
      }),
      Stack.down([
        new Button({
          height: 1,
          title: 'card 1 wider',
          hotKey: '1',
          onClick: () => resize(cards[0], 4),
        }),
        new Button({
          height: 1,
          title: 'card 1 narrower',
          hotKey: '2',
          onClick: () => resize(cards[0], -4),
        }),
        new Button({
          height: 1,
          title: 'card 2 wider',
          hotKey: '3',
          onClick: () => resize(cards[1], 4),
        }),
        new Button({
          height: 1,
          title: 'card 2 narrower',
          hotKey: '4',
          onClick: () => resize(cards[1], -4),
        }),
      ]),
    ],
  })

  demo(
    new AlignmentScope({
      padding: 1,
      children: [
        // declared before the markers it depends on - order only affects painting
        new Placement({
          left: 0,
          right: cardsStart.left.minus(2),
          child: content,
        }),
        At.topRight([
          Stack.down([
            cardsStart,
            ...cards.map(({view}, index) =>
              Stack.left([
                new Box({
                  border: 'rounded',
                  title: `card ${index + 1}`,
                  child: view,
                }),
              ]),
            ),
            cardsEnd,
          ]),
        ]),
        // a vertical pin: just below the card column, at its left edge
        new Placement({
          left: cardsStart.left,
          top: cardsEnd.top.plus(1),
          child: new Text({
            text: '↑ the widest card sets the edge',
            wrap: true,
          }),
        }),
      ],
    }),
  )
}

const DOT = '·'

main()
