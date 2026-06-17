class CreatePaymentLogs < ActiveRecord::Migration[7.1]
  def change
    create_table :payment_logs, id: :bigserial do |table|
      table.references :user, null: false, foreign_key: true
      table.references :plan, null: false, foreign_key: true
      table.string :action, null: false, limit: 50
      table.string :transaction_id, limit: 100
      table.jsonb :result, null: false, default: {}
      table.datetime :created_at, null: false
    end
  end
end
