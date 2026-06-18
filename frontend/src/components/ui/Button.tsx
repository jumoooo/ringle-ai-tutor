import { useState } from "react"

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost"
export type ButtonDisabledReason = "submitting" | "unavailable" | null

export interface ButtonProps {
  label: string
  variant: ButtonVariant
  onClick: () => void
  disabled?: boolean
  disabledReason?: ButtonDisabledReason
  minHeight?: string
  dataTestId?: string
}

const variantStyles: Record<
  ButtonVariant,
  {
    baseBackgroundColor: string
    hoverBackgroundColor: string
    baseTextColor: string
    hoverTextColor: string
    border: string
  }
> = {
  primary: {
    baseBackgroundColor: "var(--color-primary)",
    hoverBackgroundColor: "var(--color-primary-dark)",
    baseTextColor: "var(--color-text-on-primary)",
    hoverTextColor: "var(--color-text-on-primary)",
    border: "none"
  },
  secondary: {
    baseBackgroundColor: "var(--color-surface-subtle)",
    hoverBackgroundColor: "var(--color-primary-light)",
    baseTextColor: "var(--color-text-primary)",
    hoverTextColor: "var(--color-primary)",
    border: "1px solid var(--color-border)"
  },
  danger: {
    baseBackgroundColor: "var(--color-surface)",
    hoverBackgroundColor: "var(--color-promo-red)",
    baseTextColor: "var(--color-promo-red)",
    hoverTextColor: "var(--color-text-on-primary)",
    border: "1px solid var(--color-promo-red)"
  },
  ghost: {
    baseBackgroundColor: "transparent",
    hoverBackgroundColor: "var(--color-surface-subtle)",
    baseTextColor: "var(--color-text-secondary)",
    hoverTextColor: "var(--color-text-primary)",
    border: "1px solid var(--color-border)"
  }
}

export default function Button({
  label,
  variant,
  onClick,
  disabled = false,
  disabledReason = null,
  minHeight = "36px",
  dataTestId
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const currentVariantStyle = variantStyles[variant]
  const useHoverStyle = isHovered && !disabled

  const cursor = (() => {
    if (!disabled) {
      return "pointer"
    }

    if (disabledReason === "submitting") {
      return "progress"
    }

    return "not-allowed"
  })()

  return (
    <button
      type="button"
      data-testid={dataTestId}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        minHeight,
        padding: "0 var(--space-12)",
        border: currentVariantStyle.border,
        borderRadius: "var(--radius-chip)",
        backgroundColor: useHoverStyle
          ? currentVariantStyle.hoverBackgroundColor
          : currentVariantStyle.baseBackgroundColor,
        color: useHoverStyle
          ? currentVariantStyle.hoverTextColor
          : currentVariantStyle.baseTextColor,
        cursor,
        opacity: disabled ? 0.6 : 1,
        transform: useHoverStyle ? "scale(1.05)" : "scale(1)",
        transition:
          "background-color 150ms ease, color 150ms ease, transform 150ms ease",
        outline: isFocused ? "2px solid var(--color-primary)" : "none",
        outlineOffset: "2px",
        fontSize: "var(--font-size-base)",
        fontWeight: "var(--font-weight-semibold)"
      }}
    >
      {label}
    </button>
  )
}
