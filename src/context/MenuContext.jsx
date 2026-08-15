import { createContext, useContext, useState } from 'react'

const MenuContext = createContext(null)

/* Shared between SideMenu (which owns the toggle button and panel) and
   App's Layout (which needs to know when the menu is open so it can push
   page content over via padding-left, instead of the menu overlaying on
   top of it with a dimming backdrop). */
export function MenuProvider({ children }) {
  const [open, setOpen] = useState(false)
  return (
    <MenuContext.Provider value={{ open, setOpen }}>
      {children}
    </MenuContext.Provider>
  )
}

export function useMenu() {
  const ctx = useContext(MenuContext)
  if (!ctx) throw new Error('useMenu must be used within MenuProvider')
  return ctx
}
