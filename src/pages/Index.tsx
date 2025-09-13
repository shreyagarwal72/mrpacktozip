import { FileArchive, Zap, Shield, Download } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { FileUpload } from "@/components/FileUpload"
import { FeatureCard } from "@/components/FeatureCard"

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Gradient Background */}
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 opacity-30"
          style={{ background: 'var(--gradient-primary)' }}
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="rounded-lg p-2" style={{ background: 'var(--gradient-primary)' }}>
              <FileArchive className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              MRPack Converter
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20 mb-4">
            <Zap className="w-4 h-4 mr-2" />
            Free & Fast Conversion
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Convert{" "}
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Modrinth Packs
            </span>{" "}
            to ZIP
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Transform your .mrpack files into universal ZIP format for seamless compatibility 
            with any Minecraft launcher. Fast, secure, and completely free.
          </p>
        </div>

        {/* File Upload Section */}
        <div className="mb-20">
          <FileUpload />
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={Zap}
            title="Lightning Fast"
            description="Convert your modpacks in seconds with our optimized processing engine"
          />
          <FeatureCard
            icon={Shield}
            title="Completely Secure"
            description="All conversions happen locally in your browser - your files never leave your device"
          />
          <FeatureCard
            icon={Download}
            title="Universal Format"
            description="ZIP files work with any Minecraft launcher and are easy to share"
          />
        </div>

        {/* Info Section */}
        <div className="bg-card/30 backdrop-blur-sm rounded-2xl p-8 border border-border/50 text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Why Convert MRPack to ZIP?
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div>
              <h3 className="font-medium mb-2 text-primary">Better Compatibility</h3>
              <p className="text-sm text-muted-foreground">
                ZIP format is supported by virtually all Minecraft launchers including CurseForge, ATLauncher, and more.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2 text-primary">Easier Sharing</h3>
              <p className="text-sm text-muted-foreground">
                ZIP files are universally recognized and can be easily shared across different platforms and communities.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/50 backdrop-blur-md py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Built with 💜 for the Minecraft modding community
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
