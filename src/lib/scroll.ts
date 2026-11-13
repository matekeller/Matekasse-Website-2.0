import { flushSync } from 'react-dom'

// Applies `update` while the card at the top of the view stays in place, e.g.
// when new transactions are added above it.
export const keepScrollPosition = (update: () => void) => {
  const anchor =
    window.scrollY > 0 ?
      [...document.querySelectorAll('[data-slot=card]')].find(
        (card) => card.getBoundingClientRect().bottom > 0,
      )
    : undefined
  const top = anchor?.getBoundingClientRect().top

  flushSync(update)

  if (anchor?.isConnected && top !== undefined) {
    window.scrollBy({
      top: anchor.getBoundingClientRect().top - top,
      behavior: 'instant',
    })
  }
}
