import { useRef, useCallback } from "react"
import { FileArchive, Zap, Shield, Download } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { FileUpload } from "@/components/FileUpload"
import { FeatureCard } from "@/components/FeatureCard"
import { InstallButton } from "@/components/InstallButton"
import { useBetaUI } from "@/contexts/BetaUIContext"
import { useToast } from "@/hooks/use-toast"
import ExpressiveIndex from "@/pages/ExpressiveIndex"

const Index = () => {
  const { isBetaUI, toggleBetaUI } = useBetaUI()
  const { toast } = useToast()
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  const handlePressStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(50)
      toggleBetaUI()
      toast({
        title: isBetaUI ? "Classic UI Enabled" : "Beta UI Enabled",
        description: isBetaUI ? "Switched back to classic design" : "Experimental design active!",
      })
    }, 1500)
  }, [toggleBetaUI, toast, isBetaUI])

  const handlePressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  // Render Expressive UI if beta mode is enabled
  if (isBetaUI) {
    return <ExpressiveIndex />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient Background */}
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 opacity-30"
          style={{ background: 'var(--gradient-primary)' }}
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl" />
        {/* Animated gradient orbs */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-float opacity-20"
          style={{ background: 'hsl(var(--primary))' }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-float opacity-20"
          style={{ background: 'hsl(220 70% 60%)', animationDelay: '1.5s' }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/50 backdrop-blur-2xl">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between" aria-label="Main navigation">
          {/* Logo with long-press handler */}
          <div 
            className="flex items-center space-x-2 group cursor-pointer select-none"
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
          >
            <div 
              className="rounded-xl p-2 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20" 
              style={{ background: 'var(--gradient-primary)' }} 
              aria-hidden="true"
            >
              <FileArchive className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              MRPack Converter
            </span>
          </div>
          <div className="flex items-center gap-3">
            <InstallButton />
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16 space-y-6 animate-slide-up-fade">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm bg-primary/10 text-primary border border-primary/20 mb-4 backdrop-blur-md transition-all duration-300 hover:bg-primary/15 hover:border-primary/30" aria-label="Badge">
            <Zap className="w-4 h-4 mr-2" aria-hidden="true" />
            Free & Fast Conversion
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Convert Minecraft{" "}
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Modpacks
            </span>{" "}
            Between MRPACK and ZIP
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Free online modpack converter for Minecraft. Transform Modrinth .mrpack files to universal ZIP format 
            or convert ZIP modpacks to .mrpack. Compatible with CurseForge, Modrinth, and all major launchers. 
            100% secure client-side processing.
          </p>
        </section>

        {/* File Upload Section */}
        <div className="mb-20 animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
          <FileUpload />
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="animate-slide-up-fade" style={{ animationDelay: '0.2s' }}>
            <FeatureCard
              icon={Zap}
              title="Lightning Fast"
              description="Convert your modpacks in seconds with our optimized processing engine"
            />
          </div>
          <div className="animate-slide-up-fade" style={{ animationDelay: '0.3s' }}>
            <FeatureCard
              icon={Shield}
              title="Completely Secure"
              description="All conversions happen locally in your browser - your files never leave your device"
            />
          </div>
          <div className="animate-slide-up-fade" style={{ animationDelay: '0.4s' }}>
            <FeatureCard
              icon={Download}
              title="Dual Conversion"
              description="Convert both ways: MRPACK to ZIP for universal compatibility, or ZIP to MRPACK for Modrinth"
            />
          </div>
        </div>

        {/* Info Section */}
        <section 
          className="bg-card/20 backdrop-blur-2xl rounded-2xl p-8 border border-border/20 shadow-xl animate-slide-up-fade" 
          style={{ animationDelay: '0.5s' }}
          aria-labelledby="conversion-info"
        >
          <h2 id="conversion-info" className="text-2xl font-semibold mb-4 text-center">
            Why Convert Between MRPACK and ZIP Formats?
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <article className="p-4 rounded-xl bg-background/30 backdrop-blur-sm border border-border/10 transition-all duration-300 hover:border-primary/20 hover:bg-background/50">
              <h3 className="font-medium mb-2 text-primary">MRPACK to ZIP Conversion</h3>
              <p className="text-sm text-muted-foreground">
                Convert Modrinth modpacks to universal ZIP format for compatibility with CurseForge, ATLauncher, 
                Technic Launcher, and other Minecraft launchers. Downloads all mods automatically and preserves 
                configurations, resource packs, and scripts.
              </p>
            </article>
            <article className="p-4 rounded-xl bg-background/30 backdrop-blur-sm border border-border/10 transition-all duration-300 hover:border-primary/20 hover:bg-background/50">
              <h3 className="font-medium mb-2 text-primary">ZIP to MRPACK Conversion</h3>
              <p className="text-sm text-muted-foreground">
                Transform existing modpack ZIP files into Modrinth-compatible .mrpack format. Perfect for uploading 
                to Modrinth platform or using with Modrinth App. Automatically detects Fabric, Forge, Quilt, and 
                NeoForge configurations.
              </p>
            </article>
          </div>
        </section>

        {/* SEO FAQ Section */}
        <section className="mt-16 space-y-8 animate-slide-up-fade" style={{ animationDelay: '0.6s' }} aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-3xl font-bold text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <article className="space-y-2 p-4 rounded-xl bg-card/20 backdrop-blur-xl border border-border/20 transition-all duration-300 hover:border-primary/20 hover:shadow-lg">
              <h3 className="font-semibold text-lg">What is an MRPACK file?</h3>
              <p className="text-sm text-muted-foreground">
                MRPACK is Modrinth's modpack format (.mrpack extension) that contains a manifest file and 
                download links for mods. It's optimized for smaller file sizes and platform integration.
              </p>
            </article>
            <article className="space-y-2 p-4 rounded-xl bg-card/20 backdrop-blur-xl border border-border/20 transition-all duration-300 hover:border-primary/20 hover:shadow-lg">
              <h3 className="font-semibold text-lg">How do I convert MRPACK to ZIP?</h3>
              <p className="text-sm text-muted-foreground">
                Simply drag and drop your .mrpack file into the converter, select "MRPACK to ZIP" mode, 
                and click convert. The tool downloads all mods and packages them into a universal ZIP format.
              </p>
            </article>
            <article className="space-y-2 p-4 rounded-xl bg-card/20 backdrop-blur-xl border border-border/20 transition-all duration-300 hover:border-primary/20 hover:shadow-lg">
              <h3 className="font-semibold text-lg">Is the converter free to use?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! Our MRPACK converter is completely free with no registration required. All processing 
                happens in your browser for maximum privacy and security.
              </p>
            </article>
            <article className="space-y-2 p-4 rounded-xl bg-card/20 backdrop-blur-xl border border-border/20 transition-all duration-300 hover:border-primary/20 hover:shadow-lg">
              <h3 className="font-semibold text-lg">What mod loaders are supported?</h3>
              <p className="text-sm text-muted-foreground">
                The converter supports Fabric, Forge, Quilt, and NeoForge mod loaders. It automatically 
                detects the loader type from your modpack manifest.
              </p>
            </article>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/20 bg-background/30 backdrop-blur-2xl py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            <div>
              <h3 className="font-semibold mb-3">About MRPack Converter</h3>
              <p className="text-sm text-muted-foreground">
                Free online tool for converting Minecraft modpacks between MRPACK and ZIP formats. 
                Trusted by modpack developers and players worldwide.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Features</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• MRPACK to ZIP conversion</li>
                <li>• ZIP to MRPACK conversion</li>
                <li>• Client-side processing</li>
                <li>• No file size limits</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Supported Platforms</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Modrinth</li>
                <li>• CurseForge</li>
                <li>• ATLauncher</li>
                <li>• Technic Launcher</li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-6 border-t border-border/20">
            <p className="text-sm text-muted-foreground">
              Built with 💜 for the Minecraft modding community
            </p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              © 2025 Nextup Studio. All rights reserved. | Free MRPACK and ZIP modpack converter
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
