class ApplicationController < ActionController::API
  before_action :set_current_user

  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from ActiveRecord::RecordInvalid, with: :unprocessable_entity

  private

  def set_current_user
    @current_user_id = request.headers["X-User-Id"]
  end

  def current_user_id
    @current_user_id
  end

  def not_found(error)
    render json: { error: error.message, code: "not_found" }, status: :not_found
  end

  def unprocessable_entity(error)
    render json: { error: error.message, code: "invalid_record" }, status: :unprocessable_entity
  end
end
