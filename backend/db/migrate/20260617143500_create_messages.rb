class CreateMessages < ActiveRecord::Migration[7.1]
  def change
    create_table :messages do |table|
      table.references :conversation, null: false, foreign_key: true
      table.string :role, null: false, limit: 20
      table.text :content, null: false
      table.datetime :created_at, null: false
    end
  end
end
