import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/ThemeProvider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative h-9 w-9 rounded-full bg-background/50 backdrop-blur-md border-border/30 hover:border-primary/30 hover:bg-background/80 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 overflow-hidden"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        {/* Sun icon with morphing animation */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`absolute inset-0 w-5 h-5 transition-all duration-500 ease-out ${
            isDark 
              ? 'rotate-90 scale-0 opacity-0' 
              : 'rotate-0 scale-100 opacity-100'
          }`}
        >
          {/* Sun center */}
          <circle cx="12" cy="12" r="4" className="origin-center" />
          {/* Sun rays */}
          <path d="M12 2v2" className={`transition-all duration-300 ${isDark ? 'opacity-0' : 'opacity-100'}`} />
          <path d="M12 20v2" className={`transition-all duration-300 delay-75 ${isDark ? 'opacity-0' : 'opacity-100'}`} />
          <path d="m4.93 4.93 1.41 1.41" className={`transition-all duration-300 delay-100 ${isDark ? 'opacity-0' : 'opacity-100'}`} />
          <path d="m17.66 17.66 1.41 1.41" className={`transition-all duration-300 delay-150 ${isDark ? 'opacity-0' : 'opacity-100'}`} />
          <path d="M2 12h2" className={`transition-all duration-300 delay-200 ${isDark ? 'opacity-0' : 'opacity-100'}`} />
          <path d="M20 12h2" className={`transition-all duration-300 delay-150 ${isDark ? 'opacity-0' : 'opacity-100'}`} />
          <path d="m6.34 17.66-1.41 1.41" className={`transition-all duration-300 delay-100 ${isDark ? 'opacity-0' : 'opacity-100'}`} />
          <path d="m19.07 4.93-1.41 1.41" className={`transition-all duration-300 delay-75 ${isDark ? 'opacity-0' : 'opacity-100'}`} />
        </svg>

        {/* Moon icon with morphing animation */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`absolute inset-0 w-5 h-5 transition-all duration-500 ease-out ${
            isDark 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
          }`}
        >
          {/* Moon crescent - morphs from circle */}
          <path 
            d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
            className="origin-center"
          />
          {/* Stars that fade in */}
          <path 
            d="M19 3v4" 
            className={`transition-all duration-300 delay-200 ${isDark ? 'opacity-70' : 'opacity-0'}`}
          />
          <path 
            d="M17 5h4" 
            className={`transition-all duration-300 delay-200 ${isDark ? 'opacity-70' : 'opacity-0'}`}
          />
        </svg>
      </div>
    </Button>
  )
}
