import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import { ThemeProvider } from './context/ThemeContext'
import { TransitionProvider } from './context/TransitionContext'
import { MenuProvider, useMenu } from './context/MenuContext'
import SideMenu from './components/SideMenu'
import Footer from './components/Footer'
import GrainOverlay from './components/GrainOverlay'
import LiquidCursor from './components/LiquidCursor'
import InkTransition from './components/InkTransition'
import InkTransitionSprite from './components/InkTransitionSprite'
import SvgFilters from './components/SvgFilters'

/* Route-based code splitting: the single bundle was 918kB (258kB gzipped) —
   every page's code plus every decorative effect's dependencies (three.js
   for DitherBackground being the biggest) all had to download and parse
   before the FIRST paint could happen, which is what a tied FCP/LCP of
   3.27s in Speed Insights was actually measuring. Splitting each page into
   its own chunk means only the current route's code blocks initial render;
   the rest loads on navigation. DitherBackground is purely decorative (a
   background layer, not core content), so it's deferred the same way —
   three.js downloads after first paint instead of blocking it. */
const Home = lazy(() => import('./pages/Home'))
const Work = lazy(() => import('./pages/Work'))
const ProjectStussy = lazy(() => import('./pages/ProjectStussy'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const DitherBackground = lazy(() => import('./components/DitherBackground'))

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
            <Suspense fallback={null}>
              <DitherBackground />
            </Suspense>
            <GrainOverlay />
            <LiquidCursor />
            <InkTransitionSprite />
            <InkTransition />
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<Layout><Home /></Layout>} />
                <Route path="/work" element={<Layout><Work /></Layout>} />
                <Route path="/work/stussy" element={<Layout><ProjectStussy /></Layout>} />
                <Route path="/about" element={<Layout><About /></Layout>} />
                <Route path="/contact" element={<Layout><Contact /></Layout>} />
              </Routes>
            </Suspense>
          </MenuProvider>
        </ThemeProvider>
      </TransitionProvider>
    </BrowserRouter>
  )
}
