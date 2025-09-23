import { getTechBadgeClass } from "@/lib/badgeUtils";

interface TechBadgeProps {
  tech: string;
  className?: string;
}

export function TechBadge({ tech, className = "" }: TechBadgeProps) {
  return (
    <span className={`tech-badge ${getTechBadgeClass(tech)} ${className}`}>
      {tech}
    </span>
  );
}
