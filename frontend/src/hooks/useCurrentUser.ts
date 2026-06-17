import { useSyncExternalStore } from "react"

const STORAGE_KEY = "selectedUserId"
const CONVERSATION_STORAGE_KEY = "lastConversationId"
const CHANGE_EVENT_NAME = "current-user-change"

function readCurrentUserId() {
  const storedValue = window.localStorage.getItem(STORAGE_KEY)

  if (!storedValue) {
    return null
  }

  const parsedValue = Number.parseInt(storedValue, 10)
  return Number.isNaN(parsedValue) ? null : parsedValue
}

function emitCurrentUserChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT_NAME))
}

function subscribeToCurrentUser(callback: () => void) {
  const handleStorageChange = () => callback()

  window.addEventListener(CHANGE_EVENT_NAME, handleStorageChange)
  window.addEventListener("storage", handleStorageChange)

  return () => {
    window.removeEventListener(CHANGE_EVENT_NAME, handleStorageChange)
    window.removeEventListener("storage", handleStorageChange)
  }
}

export function useCurrentUser() {
  const userId = useSyncExternalStore(
    subscribeToCurrentUser,
    readCurrentUserId,
    () => null
  )

  function selectUser(nextUserId: number) {
    window.localStorage.setItem(STORAGE_KEY, String(nextUserId))
    window.localStorage.removeItem(CONVERSATION_STORAGE_KEY)
    emitCurrentUserChange()
  }

  function clearUser() {
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(CONVERSATION_STORAGE_KEY)
    emitCurrentUserChange()
  }

  return {
    userId,
    selectUser,
    clearUser
  }
}
