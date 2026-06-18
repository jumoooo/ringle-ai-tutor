import Button, {
  type ButtonDisabledReason,
  type ButtonVariant
} from "@/components/ui/Button"
export type AdminButtonVariant = "plan-active" | "plan-inactive" | "danger"
export type AdminButtonDisabledReason = "submitting" | "unavailable" | null

interface AdminButtonProps {
  label: string
  variant: AdminButtonVariant
  onClick: () => void
  disabled?: boolean
  disabledReason?: AdminButtonDisabledReason
}

const variantMap: Record<AdminButtonVariant, ButtonVariant> = {
  "plan-active": "primary",
  "plan-inactive": "secondary",
  danger: "danger"
}

export default function AdminButton({
  label,
  variant,
  onClick,
  disabled = false,
  disabledReason = null
}: AdminButtonProps) {
  return (
    <Button
      label={label}
      variant={variantMap[variant]}
      onClick={onClick}
      disabled={disabled}
      disabledReason={disabledReason as ButtonDisabledReason}
    />
  )
}
