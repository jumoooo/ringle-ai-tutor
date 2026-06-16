module Api
  module V1
    class HealthController < ApplicationController
      def show
        render json: {
          data: {
            status: "ok",
            timestamp: Time.current.iso8601,
            version: "1.0.0"
          }
        }, status: :ok
      end
    end
  end
end
