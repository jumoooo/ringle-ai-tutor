Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins AppConfig.cors_origin

    resource "*",
      headers: :any,
      methods: %i[get post put patch delete options head],
      expose: ["X-Request-Id"]
  end
end
