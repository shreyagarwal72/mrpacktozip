import { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card className="group p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card/50 backdrop-blur-sm border border-border/50">
      <div className="mb-4 flex justify-center">
        <div className="rounded-full p-3 transition-all duration-300 group-hover:scale-110"
             style={{ background: 'var(--gradient-primary)' }}>
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
      </div>
      <h3 className="mb-2 text-center text-lg font-semibold">{title}</h3>
      <p className="text-center text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </Card>
  )
}