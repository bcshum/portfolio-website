export default function Eyebrow({ label, name }) {
  return (
    <div className="eyebrow">
      <span className="eyebrow-tick" />
      <span className="eyebrow-label">{label}</span>
      {name && <span className="eyebrow-name">— {name}</span>}
      <span className="eyebrow-line" />
    </div>
  )
}
