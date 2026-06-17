class CreatePlans < ActiveRecord::Migration[7.1]
  def change
    create_table :plans do |table|
      table.string :name, null: false, limit: 50
      table.integer :monthly_price, null: false, default: 0
      table.boolean :can_learn, null: false, default: false
      table.boolean :can_talk, null: false, default: false
      table.boolean :can_analyze, null: false, default: false
      table.integer :duration_days, null: false, default: 30
      table.jsonb :features, null: false, default: {}
      table.timestamps null: false
    end

    add_index :plans, :name, unique: true
  end
end
