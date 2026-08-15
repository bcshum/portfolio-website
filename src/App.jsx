import { BrowserRouter, Routes, Route } from 'react-router'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import { ThemeProvider } from './context/ThemeContext'
import { TransitionProvider } from './context/TransitionContext'
import { MenuProvider, useMenu } from './context/MenuContext'
import SideMenu from './components/SideMenu'
import Footer from './components/Footer'
import GrainOverlay from './components/GrainOverlay'
import DitherBackground from './components/DitherBackground'
import LiquidCursor from './components/LiquidCursor'
import InkTransition from './components/InkTransition'
import InkTransitionSprite from './components/InkTransitionSprite'
import SvgFilters from './components/SvgFilters'
import Home from './pages/Home'
import Work from './pages/Work'
import ProjectStussy from './pages/ProjectStussy'
import About from './pages/About'
import Contact from './pages/Contact'

function Layout({ children }) {
  const { open } = useMenu()
  return (
    <>
      <SideMenu />
      {/* SideMenu is a persistent fixed-position left rail (not a top bar
          in normal flow like the old Nav it replaced), pinned for the
          full viewport height — so both main content AND the footer need
          matching left clearance, not just a one-off top offset, since
          the rail stays put no matter how far down the page is scrolled.
          The padding here widens when the menu opens (see .side-menu-content
          in index.css) so the page content is pushed over rather than
          covered by the menu panel. */}
      <div className={`side-menu-content ${open ? 'side-menu-content--open' : ''}`}>
        <main>{children}</main>
        <Footer />
      </div>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      {/* TransitionProvider needs router context (useNavigate/useLocation),
          so it has to sit inside BrowserRouter - but it wraps everything
          else so any page can trigger the ink transition via useTransition(). */}
      <TransitionProvider>
        <ThemeProvider>
          <MenuProvider>
            {/* Mounted once at the app root, outside <Routes>, so they persist
                across navigation instead of remounting/flickering per page. */}
            <SvgFilters />
            <SpeedInsights />
            <Analytics />
            <DitherBackground />
            <GrainOverlay />
            <LiquidCursor />
            <InkTransitionSprite />
            <InkTransition />
            <Routes>
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/work" element={<Layout><Work /></Layout>} />
              <Route path="/work/stussy" element={<Layout><ProjectStussy /></Layout>} />
              <Route path="/about" element={<Layout><About /></Layout>} />
              <Route path="/contact" element={<Layout><Contact /></Layout>} />
            </Routes>
          </MenuProvider>
        </ThemeProvider>
      </TransitionProvider>
    </BrowserRouter>
  )
}
