import { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card className="group p-6 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 bg-card/30 backdrop-blur-xl border border-border/20 hover:border-primary/30 hover:bg-card/50">
      <div className="mb-4 flex justify-center">
        <div 
          className="rounded-full p-3 transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20"
          style={{ background: 'var(--gradient-primary)' }}
        >
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
      </div>
      <h3 className="mb-2 text-center text-lg font-semibold transition-colors duration-300 group-hover:text-primary">
        {title}
      </h3>
      <p className="text-center text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </Card>
  )
}
