if defined?(Rack::Attack)
  Rack::Attack.cache.store = if Rails.cache.is_a?(ActiveSupport::Cache::NullStore)
    ActiveSupport::Cache::MemoryStore.new
  else
    Rails.cache
  end

  Rack::Attack.throttle("ai/stt/user", limit: 10, period: 60) do |request|
    request.get_header("HTTP_X_USER_ID") if request.path.start_with?("/api/v1/stt")
  end

  Rack::Attack.throttle("ai/chat/user", limit: 10, period: 60) do |request|
    request.get_header("HTTP_X_USER_ID") if request.path.start_with?("/api/v1/chat")
  end

  Rack::Attack.throttle("ai/tts/user", limit: 20, period: 60) do |request|
    request.get_header("HTTP_X_USER_ID") if request.path.start_with?("/api/v1/tts")
  end

  Rack::Attack.throttled_responder = lambda do |_request|
    [429, { "Content-Type" => "application/json" }, [JSON.generate({ error: "Rate limit exceeded", code: "rate_limit_exceeded" })]]
  end
end
