import { useState } from "react"

export type AdminButtonVariant = "plan-active" | "plan-inactive" | "danger"
export type AdminButtonDisabledReason = "submitting" | "unavailable" | null

interface AdminButtonProps {
  label: string
  variant: AdminButtonVariant
  onClick: () => void
  disabled?: boolean
  disabledReason?: AdminButtonDisabledReason
}

const variantStyles: Record<
  AdminButtonVariant,
  {
    baseBackgroundColor: string
    baseTextColor: string
    hoverBackgroundColor: string
    hoverTextColor: string
    border: string
    fontWeight: string
  }
> = {
  "plan-active": {
    baseBackgroundColor: "var(--color-primary)",
    baseTextColor: "var(--color-text-on-primary)",
    hoverBackgroundColor: "var(--color-primary-dark)",
    hoverTextColor: "var(--color-text-on-primary)",
    border: "none",
    fontWeight: "var(--font-weight-semibold)"
  },
  "plan-inactive": {
    baseBackgroundColor: "var(--color-surface-subtle)",
    baseTextColor: "var(--color-text-primary)",
    hoverBackgroundColor: "var(--color-primary-light)",
    hoverTextColor: "var(--color-primary)",
    border: "1px solid var(--color-border)",
    fontWeight: "var(--font-weight-regular)"
  },
  danger: {
    baseBackgroundColor: "var(--color-surface)",
    baseTextColor: "var(--color-promo-red)",
    hoverBackgroundColor: "var(--color-promo-red)",
    hoverTextColor: "var(--color-text-on-primary)",
    border: "1px solid var(--color-promo-red)",
    fontWeight: "var(--font-weight-regular)"
  }
}

export default function AdminButton({
  label,
  variant,
  onClick,
  disabled = false,
  disabledReason = null
}: AdminButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const selectedVariantStyle = variantStyles[variant]
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
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        minHeight: "36px",
        padding: "0 var(--space-12)",
        border: selectedVariantStyle.border,
        borderRadius: "var(--radius-chip)",
        backgroundColor: useHoverStyle
          ? selectedVariantStyle.hoverBackgroundColor
          : selectedVariantStyle.baseBackgroundColor,
        color: useHoverStyle
          ? selectedVariantStyle.hoverTextColor
          : selectedVariantStyle.baseTextColor,
        cursor,
        opacity: disabled ? 0.6 : 1,
        transform: useHoverStyle ? "scale(1.05)" : "scale(1)",
        transition:
          "background-color 150ms ease, color 150ms ease, transform 150ms ease",
        outline: isFocused ? "2px solid var(--color-primary)" : "none",
        outlineOffset: "2px",
        fontWeight: selectedVariantStyle.fontWeight,
        fontSize: "var(--font-size-base)"
      }}
    >
      {label}
    </button>
  )
}
