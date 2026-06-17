class CreateMemberships < ActiveRecord::Migration[7.1]
  def change
    create_table :memberships do |table|
      table.references :user, null: false, foreign_key: true
      table.references :plan, null: false, foreign_key: true
      table.string :status, null: false, default: "trial", limit: 20
      table.datetime :starts_at, null: false
      table.datetime :expires_at, null: false
      table.timestamps null: false
    end

    add_index :memberships, :expires_at
  end
end
