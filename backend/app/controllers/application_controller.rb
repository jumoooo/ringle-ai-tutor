class ApplicationController < ActionController::API
  MAX_USER_INPUT_CHARS = 2000

  before_action :set_current_user

  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from ActiveRecord::RecordInvalid, with: :unprocessable_entity

  private

  def set_current_user
    user_id = request.headers["X-User-Id"]
    @current_user = User.find_by(id: user_id) if user_id.present?
  end

  def require_user!
    return if @current_user

    forbidden("User not found")
  end

  def require_admin!
    return if @current_user&.admin?

    forbidden("Admin access required")
  end

  def require_talk_access!
    membership = @current_user&.memberships&.current&.first
    return if membership&.active? && membership&.plan&.can_talk

    forbidden("Talk permission required")
  end

  def not_found(error)
    render json: { error: error.message, code: "not_found" }, status: :not_found
  end

  def unprocessable_entity(error)
    render json: { error: error.message, code: "invalid_record" }, status: 422
  end

  def forbidden(message = "Forbidden")
    render json: { error: message, code: "forbidden" }, status: :forbidden
  end
end
