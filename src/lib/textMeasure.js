/* Shared glyph-width measurement for the side menu's letter cells.
   Even with a mono face, measuring against the actual loaded font keeps
   the reel and reveal spans matched to what the browser is rendering. */
export const FONT_WEIGHT = 400
const REF_SIZE = 200
let measureCtx = null

export function measureCharEm(char) {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d')
  measureCtx.font = `${FONT_WEIGHT} ${REF_SIZE}px "Xanh Mono", monospace`
  return measureCtx.measureText(char).width / REF_SIZE
}
