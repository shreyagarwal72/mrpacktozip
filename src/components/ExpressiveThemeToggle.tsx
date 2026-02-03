import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { cn } from "@/lib/utils"

export function ExpressiveThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative h-12 w-12 rounded-full flex items-center justify-center",
        "bg-expressive-surface/80 backdrop-blur-xl border border-expressive-border/30",
        "transition-all duration-300 hover:scale-110 hover:shadow-expressive",
        "active:scale-95"
      )}
      style={{
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Sun icon */}
      <Sun 
        className={cn(
          "absolute h-6 w-6 text-primary transition-all duration-300",
          isDark ? "opacity-0 scale-50 rotate-90" : "opacity-100 scale-100 rotate-0"
        )}
        style={{
          transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        }}
      />
      
      {/* Moon icon */}
      <Moon 
        className={cn(
          "absolute h-6 w-6 text-expressive-primary transition-all duration-300",
          isDark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"
        )}
        style={{
          transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        }}
      />
    </button>
  )
}
