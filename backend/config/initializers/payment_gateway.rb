# PG사 교체 시 아래 상수 1줄만 변경한다.
# 예: PaymentGateway = Payments::IamportService
#
# autoload 완료 후 상수를 정의하기 위해 after_initialize를 사용한다.
Rails.application.config.after_initialize do
  PaymentGateway = Payments::MockPaymentService
end
