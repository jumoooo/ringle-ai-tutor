function injectKeyframe() {
  if (typeof document === "undefined") return
  if (document.getElementById("skeleton-keyframe")) return
  const style = document.createElement("style")
  style.id = "skeleton-keyframe"
  style.textContent = `
    @keyframes skeleton-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `
  document.head.appendChild(style)
}

interface SkeletonBlockProps {
  width?: string
  height?: string
  borderRadius?: string
}

export function SkeletonBlock({
  width = "100%",
  height = "20px",
  borderRadius = "var(--radius-chip)"
}: SkeletonBlockProps) {
  injectKeyframe()
  return (
    <div
      data-testid="skeleton-block"
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: "var(--color-surface-subtle)",
        animation: "skeleton-pulse 1.5s ease-in-out infinite"
      }}
    />
  )
}

interface SkeletonTextProps {
  width?: string
}

export function SkeletonText({ width = "100%" }: SkeletonTextProps) {
  injectKeyframe()
  return (
    <div
      data-testid="skeleton-text"
      style={{
        width,
        height: "16px",
        borderRadius: "var(--radius-chip)",
        backgroundColor: "var(--color-surface-subtle)",
        animation: "skeleton-pulse 1.5s ease-in-out infinite"
      }}
    />
  )
}
