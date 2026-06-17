Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      get "health", to: "health#show"

      resources :users, only: %i[index show]
      resources :plans, only: %i[index]

      scope :memberships do
        get "current", to: "memberships#current"
        post "purchase", to: "memberships#purchase"
        post "upgrade", to: "memberships#upgrade"
      end

      post "stt", to: "stt#create"
      post "tts", to: "tts#create"
      post "chat", to: "chat_streams#create"
      resources :conversations, only: %i[create show]

      namespace :admin do
        resources :users, only: %i[index] do
          resources :memberships, only: %i[create] do
            collection do
              delete "current", to: "memberships#revoke"
            end
          end
        end
      end
    end
  end
end
