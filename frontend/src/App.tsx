import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import AdminGuard from "@/components/AdminGuard"
import { ToastProvider, ToastViewport } from "@/components/Toast"
import { useMembership } from "@/features/membership/hooks/useMembership"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import AdminPage from "@/pages/AdminPage"
import ChatPage from "@/pages/ChatPage"
import HomePage from "@/pages/HomePage"
import LearnPage from "@/pages/LearnPage"
import PlansPage from "@/pages/PlansPage"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000
    }
  }
})

function LearnRoute() {
  const { userId } = useCurrentUser()
  const { data: membership, isLoading } = useMembership(userId)

  if (isLoading) {
    return null
  }

  const canLearn =
    (membership?.status === "active" || membership?.status === "trial") &&
    membership.plan.can_learn

  return canLearn ? <LearnPage /> : <Navigate to="/" replace />
}

function AppRoutes() {
  const { userId } = useCurrentUser()

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/plans" element={<PlansPage />} />
      <Route
        path="/chat"
        element={userId !== null ? <ChatPage /> : <Navigate to="/" replace />}
      />
      <Route path="/learn" element={<LearnRoute />} />
      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminPage />
          </AdminGuard>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
          <ToastViewport />
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
