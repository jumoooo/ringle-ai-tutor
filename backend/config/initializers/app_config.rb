module AppConfig
  module_function

  def openai_api_key
    ENV.fetch("OPENAI_API_KEY")
  end

  def database_url
    ENV["DATABASE_URL"]
  end

  def cors_origin
    ENV.fetch("CORS_ORIGIN", "http://localhost:5173")
  end

  def backend_port
    ENV.fetch("BACKEND_PORT", "3000").to_i
  end
end
