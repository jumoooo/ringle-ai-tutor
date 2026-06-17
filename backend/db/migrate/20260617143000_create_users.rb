class CreateUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :users do |table|
      table.string :name, null: false, limit: 100
      table.string :email, null: false, limit: 255
      table.timestamps null: false
    end

    add_index :users, :email, unique: true
  end
end
