class AddRoleToUsers < ActiveRecord::Migration[7.1]
  def up
    add_column :users, :role, :string, default: nil

    execute <<~SQL
      ALTER TABLE users
      ADD CONSTRAINT check_users_role
      CHECK (role IN ('admin') OR role IS NULL);
    SQL
  end

  def down
    execute "ALTER TABLE users DROP CONSTRAINT check_users_role"
    remove_column :users, :role
  end
end
