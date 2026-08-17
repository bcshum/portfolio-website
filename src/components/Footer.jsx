export default function Footer() {
  return (
    <footer className="relative bg-paper-alt py-12 mt-32">
      <div className="max-w-[72rem] mx-auto px-5 sm:px-8 flex flex-wrap items-center justify-between gap-4 font-mono text-[0.72rem] tracking-[0.14em] uppercase text-faint">
        <span>© 2026 Bryan Shum</span>
        <div className="flex gap-8">
          <a href="mailto:bcshum@sfu.ca" className="text-muted hover:text-accent transition-colors duration-200">Email</a>
          <a href="#" className="text-muted hover:text-accent transition-colors duration-200">LinkedIn</a>
          <a href="#" className="text-muted hover:text-accent transition-colors duration-200">GitHub</a>
        </div>
      </div>
    </footer>
  )
}
