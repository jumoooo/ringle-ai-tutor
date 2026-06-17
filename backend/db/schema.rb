# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2026_06_17_143500) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "conversations", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "status", limit: 20, default: "active", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_conversations_on_user_id"
  end

  create_table "memberships", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "plan_id", null: false
    t.string "status", limit: 20, default: "trial", null: false
    t.datetime "starts_at", null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_memberships_on_expires_at"
    t.index ["plan_id"], name: "index_memberships_on_plan_id"
    t.index ["user_id"], name: "index_memberships_on_user_id"
  end

  create_table "messages", force: :cascade do |t|
    t.bigint "conversation_id", null: false
    t.string "role", limit: 20, null: false
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.index ["conversation_id"], name: "index_messages_on_conversation_id"
  end

  create_table "payment_logs", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "plan_id", null: false
    t.string "action", limit: 50, null: false
    t.string "transaction_id", limit: 100
    t.jsonb "result", default: {}, null: false
    t.datetime "created_at", null: false
    t.index ["plan_id"], name: "index_payment_logs_on_plan_id"
    t.index ["user_id"], name: "index_payment_logs_on_user_id"
  end

  create_table "plans", force: :cascade do |t|
    t.string "name", limit: 50, null: false
    t.integer "monthly_price", default: 0, null: false
    t.boolean "can_learn", default: false, null: false
    t.boolean "can_talk", default: false, null: false
    t.boolean "can_analyze", default: false, null: false
    t.integer "duration_days", default: 30, null: false
    t.jsonb "features", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_plans_on_name", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "name", limit: 100, null: false
    t.string "email", limit: 255, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "conversations", "users"
  add_foreign_key "memberships", "plans"
  add_foreign_key "memberships", "users"
  add_foreign_key "messages", "conversations"
  add_foreign_key "payment_logs", "plans"
  add_foreign_key "payment_logs", "users"
end
