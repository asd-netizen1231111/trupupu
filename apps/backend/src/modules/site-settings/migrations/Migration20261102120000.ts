import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261102120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "site_settings" add column if not exists "face" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "site_settings" drop column if exists "face";`);
  }

}
