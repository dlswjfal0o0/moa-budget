import { useEffect, useState } from 'react'

/**
 * Returns a function `isVisible(index)` that returns true once
 * each staggered item's entrance delay has elapsed.
 *
 * @param {number} count       Total number of items
 * @param {number} delay       ms between each item (default 30)
 * @param {number} startDelay  Initial delay before first item (default 60)
 */
export function useStagger(count, delay = 30, startDelay = 60) {
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    const timers = Array.from({ length: count }, (_, i) =>
      setTimeout(() => setVisible(i + 1), startDelay + i * delay)
    )
    return () => timers.forEach(clearTimeout)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (index) => index < visible
}
