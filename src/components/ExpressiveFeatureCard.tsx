import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExpressiveFeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  className?: string
}

export function ExpressiveFeatureCard({ icon: Icon, title, description, className }: ExpressiveFeatureCardProps) {
  return (
    <div 
      className={cn(
        "group relative p-6 rounded-expressive-lg bg-expressive-surface/50 backdrop-blur-2xl border border-expressive-border/30",
        "transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1",
        "hover:shadow-expressive-lg hover:border-expressive-primary/30",
        className
      )}
      style={{
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* Gradient glow on hover */}
      <div className="absolute inset-0 rounded-expressive-lg bg-gradient-to-br from-expressive-primary/5 to-expressive-glow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        {/* Icon container */}
        <div className="mb-5 flex justify-center">
          <div 
            className="rounded-full p-4 bg-gradient-to-br from-expressive-primary to-expressive-glow shadow-expressive transition-all duration-300 group-hover:scale-110 group-hover:shadow-expressive-lg"
            style={{
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>
        
        {/* Title */}
        <h3 className="mb-3 text-center text-xl font-bold text-expressive-foreground group-hover:text-expressive-primary transition-colors duration-300">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-center text-base text-expressive-muted leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  )
}
