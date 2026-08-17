function InkScene({ className = '', opacity = 1 }) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 320"
      fill="none"
      aria-hidden="true"
      style={{ opacity }}
    >
      <path
        d="M31 209C84 162 126 134 176 127C225 120 254 142 295 146C337 150 387 135 432 102C470 75 508 47 565 35C522 81 494 109 477 127C457 149 443 166 421 179C392 196 357 204 319 208C274 213 236 210 192 221C133 236 88 259 44 292C56 268 60 247 58 232C57 223 49 217 31 209Z"
        fill="currentColor"
      />
      <path
        d="M65 239C122 214 158 207 197 209C238 211 272 226 321 223C366 220 404 202 456 167C494 142 529 117 576 104C542 141 520 166 510 181C495 202 492 214 474 230C452 249 420 265 377 274C324 286 269 278 216 282C163 286 119 297 80 311C87 287 87 270 82 258C79 249 72 243 65 239Z"
        fill="currentColor"
      />
      <path
        d="M0 287C52 273 90 264 137 258C190 250 231 247 280 250C334 253 381 261 435 258C500 254 562 237 640 197V320H0V287Z"
        fill="currentColor"
      />
      <path
        d="M162 44C218 63 262 72 335 72C408 72 462 60 531 29C505 60 493 82 496 96C500 115 522 125 560 142C501 148 457 161 406 188C350 217 302 221 257 204C221 190 195 170 154 144C116 120 88 109 54 111C82 90 101 76 111 65C122 53 128 43 138 32C142 28 150 32 162 44Z"
        fill="currentColor"
      />
      <path
        d="M18 70C107 56 189 49 264 50C352 51 420 61 514 92"
        stroke="currentColor"
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BrushStroke({ className = '', opacity = 1 }) {
  return (
    <svg
      className={className}
      viewBox="0 0 520 120"
      fill="none"
      aria-hidden="true"
      style={{ opacity }}
    >
      <path
        d="M22 69C54 57 88 50 132 44C192 36 244 34 311 39C365 43 414 52 492 69C447 72 418 78 399 89C390 95 380 100 362 101C333 104 301 91 260 89C228 87 206 92 171 99C120 109 84 109 29 91C18 87 13 74 22 69Z"
        fill="currentColor"
      />
      <path
        d="M6 56C65 31 123 18 195 11C274 3 340 7 424 24"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M446 31C463 39 475 48 493 67"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function InkMotif({ variant = 'scene', className = '', opacity }) {
  if (variant === 'brush') {
    return <BrushStroke className={className} opacity={opacity ?? 1} />
  }

  return <InkScene className={className} opacity={opacity ?? 1} />
}
