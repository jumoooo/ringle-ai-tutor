import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/api/client"
import Button from "@/components/ui/Button"
import { API_ENDPOINTS } from "@/config/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { UserArraySchema } from "@/types/user"

async function fetchUsers() {
  const response = await apiClient.get(API_ENDPOINTS.users)
  return UserArraySchema.parse(response.data.data)
}

export default function UserDropdown() {
  const { userId, selectUser, clearUser } = useCurrentUser()
  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers
  })

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-8)" }}>
      <label
        htmlFor="user-dropdown"
        style={{
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-secondary)",
          whiteSpace: "nowrap"
        }}
      >
        현재 사용자
      </label>

      <select
        id="user-dropdown"
        value={userId ?? ""}
        onChange={(event) => {
          const nextValue = event.target.value

          if (!nextValue) {
            clearUser()
            return
          }

          selectUser(Number(nextValue))
        }}
        disabled={isLoading || isError}
        style={{
          flex: 1,
          minHeight: "40px",
          borderRadius: "var(--radius-card)",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text-primary)",
          padding: "0 var(--space-12)"
        }}
      >
        <option value="">
          {isLoading ? "사용자 불러오는 중..." : "사용자를 선택해주세요"}
        </option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.email})
          </option>
        ))}
      </select>

      <Button
        label="초기화"
        variant="ghost"
        onClick={clearUser}
        disabled={userId === null}
        disabledReason={userId === null ? "unavailable" : null}
        minHeight="40px"
      />
    </div>
  )
}
