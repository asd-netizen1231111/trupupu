import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261101120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "site_settings" add column if not exists "bank_name" text null, add column if not exists "bank_account" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "site_settings" drop column if exists "bank_name", drop column if exists "bank_account";`);
  }

}
