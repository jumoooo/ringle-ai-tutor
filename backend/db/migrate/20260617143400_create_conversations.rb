class CreateConversations < ActiveRecord::Migration[7.1]
  def change
    create_table :conversations do |table|
      table.references :user, null: false, foreign_key: true
      table.string :status, null: false, default: "active", limit: 20
      table.timestamps null: false
    end
  end
end
