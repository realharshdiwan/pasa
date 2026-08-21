import type { DieFace } from '../engine/types'
import { DIE_DOT_POSITIONS } from './dieConstants'
import { DIE_THEME_COLORS } from '../utils/cosmetics'

interface DieFaceDisplayProps {
  face: DieFace
  size?: number
  theme?: string
  className?: string
}

export default function DieFaceDisplay({ face, size = 64, theme = 'classic', className = '' }: DieFaceDisplayProps) {
  const dots = DIE_DOT_POSITIONS[face]
  const dotRadius = size * 0.1
  const padding = size * 0.15
  const colors = DIE_THEME_COLORS[theme as keyof typeof DIE_THEME_COLORS] || DIE_THEME_COLORS.classic

  return (
    <div
      className={`flex items-center justify-center rounded-lg border-2 transition-transform duration-150 ${className}`}
      style={{ width: size, height: size, backgroundColor: colors.bg, borderColor: colors.border }}
    >
      <div className="relative" style={{ width: size - padding * 2, height: size - padding * 2 }}>
        {dots.map(([x, y], i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: dotRadius * 2,
              height: dotRadius * 2,
              left: `calc(${x * 100}% - ${dotRadius}px)`,
              top: `calc(${y * 100}% - ${dotRadius}px)`,
              backgroundColor: colors.dots,
            }}
          />
        ))}
      </div>
    </div>
  )
}
