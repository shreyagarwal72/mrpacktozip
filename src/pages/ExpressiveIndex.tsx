import { useRef, useCallback } from "react"
import { FileArchive, Zap, Shield, Download, Sparkles } from "lucide-react"
import { ExpressiveThemeToggle } from "@/components/ExpressiveThemeToggle"
import { ExpressiveFileUpload } from "@/components/ExpressiveFileUpload"
import { ExpressiveFeatureCard } from "@/components/ExpressiveFeatureCard"
import { InstallButton } from "@/components/InstallButton"
import { useBetaUI } from "@/contexts/BetaUIContext"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const ExpressiveIndex = () => {
  const { toggleBetaUI } = useBetaUI()
  const { toast } = useToast()
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  const handlePressStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(50)
      toggleBetaUI()
      toast({
        title: "Classic UI Enabled",
        description: "Switched back to classic design",
      })
    }, 1500)
  }, [toggleBetaUI, toast])

  const handlePressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  return (
    <div className="min-h-screen bg-expressive-background expressive">
      {/* Expressive Gradient Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-expressive-background via-expressive-surface to-expressive-background" />
        
        {/* Animated gradient orbs - larger and more vibrant */}
        <div 
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-30"
          style={{ 
            background: 'linear-gradient(135deg, hsl(280 70% 55%), hsl(250 80% 60%))',
            animation: 'expressive-float 8s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-25"
          style={{ 
            background: 'linear-gradient(135deg, hsl(250 80% 60%), hsl(220 75% 55%))',
            animation: 'expressive-float 8s ease-in-out infinite',
            animationDelay: '2s'
          }}
        />
        <div 
          className="absolute top-1/2 right-1/3 w-[300px] h-[300px] rounded-full blur-[80px] opacity-20"
          style={{ 
            background: 'linear-gradient(135deg, hsl(320 70% 50%), hsl(280 70% 55%))',
            animation: 'expressive-float 8s ease-in-out infinite',
            animationDelay: '4s'
          }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-expressive-border/20 bg-expressive-background/60 backdrop-blur-2xl">
        <nav className="container mx-auto px-4 py-5 flex items-center justify-between">
          {/* Logo with long-press handler */}
          <div 
            className="flex items-center space-x-3 group cursor-pointer select-none"
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
          >
            <div 
              className={cn(
                "rounded-full p-3 transition-all duration-300",
                "bg-gradient-to-br from-expressive-primary to-expressive-glow",
                "shadow-expressive group-hover:shadow-expressive-lg group-hover:scale-110"
              )}
              style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              <FileArchive className="h-7 w-7 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold bg-gradient-to-r from-expressive-primary via-expressive-glow to-expressive-primary bg-clip-text text-transparent">
                MRPack Converter
              </span>
              <span className="text-xs font-medium text-expressive-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Beta UI
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <InstallButton />
            <ExpressiveThemeToggle />
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <section 
          className="text-center mb-20 space-y-8"
          style={{ animation: 'expressive-slide-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          {/* Badge */}
          <div 
            className="inline-flex items-center px-5 py-2 rounded-full text-sm font-semibold bg-expressive-primary/15 text-expressive-primary border border-expressive-primary/30 backdrop-blur-xl"
            style={{ animation: 'expressive-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both' }}
          >
            <Zap className="w-4 h-4 mr-2" />
            Free & Fast Conversion
          </div>
          
          {/* Main Heading */}
          <h1 
            className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight"
            style={{ animation: 'expressive-slide-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both' }}
          >
            Convert Minecraft{" "}
            <span className="bg-gradient-to-r from-expressive-primary via-expressive-glow to-expressive-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
              Modpacks
            </span>
            <br />
            <span className="text-expressive-muted">Between Formats</span>
          </h1>
          
          {/* Subtitle */}
          <p 
            className="text-xl md:text-2xl text-expressive-muted max-w-3xl mx-auto leading-relaxed"
            style={{ animation: 'expressive-slide-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both' }}
          >
            Transform Modrinth .mrpack files to universal ZIP or convert ZIP modpacks to .mrpack.
            <span className="text-expressive-foreground font-medium"> 100% secure, client-side processing.</span>
          </p>
        </section>

        {/* File Upload Section */}
        <div 
          className="mb-24"
          style={{ animation: 'expressive-slide-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both' }}
        >
          <ExpressiveFileUpload />
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div style={{ animation: 'expressive-slide-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both' }}>
            <ExpressiveFeatureCard
              icon={Zap}
              title="Lightning Fast"
              description="Convert your modpacks in seconds with our optimized processing engine"
            />
          </div>
          <div style={{ animation: 'expressive-slide-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both' }}>
            <ExpressiveFeatureCard
              icon={Shield}
              title="Completely Secure"
              description="All conversions happen locally in your browser - your files never leave your device"
            />
          </div>
          <div style={{ animation: 'expressive-slide-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s both' }}>
            <ExpressiveFeatureCard
              icon={Download}
              title="Dual Conversion"
              description="Convert both ways: MRPACK to ZIP for universal compatibility, or ZIP to MRPACK for Modrinth"
            />
          </div>
        </div>

        {/* Info Cards */}
        <section 
          className="rounded-expressive-xl p-10 bg-expressive-surface/40 backdrop-blur-2xl border border-expressive-border/20 shadow-expressive-lg mb-16"
          style={{ animation: 'expressive-slide-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.7s both' }}
        >
          <h2 className="text-3xl font-bold mb-8 text-center text-expressive-foreground">
            Why Convert Between Formats?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-expressive-lg bg-expressive-background/50 border border-expressive-border/20 transition-all duration-300 hover:border-expressive-primary/30 hover:shadow-expressive">
              <h3 className="font-bold text-lg mb-3 text-expressive-primary">MRPACK → ZIP</h3>
              <p className="text-expressive-muted leading-relaxed">
                Convert Modrinth modpacks to universal ZIP format for compatibility with CurseForge, ATLauncher, and other launchers.
              </p>
            </div>
            <div className="p-6 rounded-expressive-lg bg-expressive-background/50 border border-expressive-border/20 transition-all duration-300 hover:border-expressive-primary/30 hover:shadow-expressive">
              <h3 className="font-bold text-lg mb-3 text-expressive-primary">ZIP → MRPACK</h3>
              <p className="text-expressive-muted leading-relaxed">
                Transform modpack ZIPs into Modrinth-compatible .mrpack format. Perfect for uploading to Modrinth or using with Modrinth App.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-expressive-border/20 bg-expressive-surface/30 backdrop-blur-2xl py-10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-expressive-muted mb-2">
            Built with 💜 for the Minecraft modding community
          </p>
          <p className="text-sm text-expressive-muted/60">
            © 2025 Nextup Studio. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default ExpressiveIndex
