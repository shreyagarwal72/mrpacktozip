import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface BetaUIContextType {
  isBetaUI: boolean
  toggleBetaUI: () => void
}

const BetaUIContext = createContext<BetaUIContextType | undefined>(undefined)

export function BetaUIProvider({ children }: { children: ReactNode }) {
  const [isBetaUI, setIsBetaUI] = useState(() => {
    try {
      return localStorage.getItem('beta-ui-enabled') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('beta-ui-enabled', isBetaUI.toString())
    } catch {
      // localStorage not available
    }
  }, [isBetaUI])

  const toggleBetaUI = () => {
    setIsBetaUI(prev => !prev)
  }

  return (
    <BetaUIContext.Provider value={{ isBetaUI, toggleBetaUI }}>
      {children}
    </BetaUIContext.Provider>
  )
}

export function useBetaUI() {
  const context = useContext(BetaUIContext)
  if (context === undefined) {
    throw new Error('useBetaUI must be used within a BetaUIProvider')
  }
  return context
}
