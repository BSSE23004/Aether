Prisma Migrations and Deployment Strategy for Aether

Overview

- Use `prisma migrate` for schema changes in development and CI.
- Keep migrations in `apps/api/prisma/migrations` tracked by git.
- For production/staging, use `prisma migrate deploy` to apply existing migrations.

Local development flow

1. Make schema changes in `prisma/schema.prisma`.
2. Run `pnpm --filter @aether/api prisma migrate dev --name <desc>` or from `apps/api` run:

   ```bash
   npx prisma migrate dev --name add_users_wallets
   ```

   This will:
   - create a new migration SQL file under `prisma/migrations/<timestamp>_<name>`
   - update the local db
   - run `prisma generate` automatically

3. Commit `prisma/schema.prisma` and the new migration folder to git.

CI / Deployment

- In CI and production, do NOT run `migrate dev`.
- Instead: build and then run migrations:

  ```bash
  npx prisma generate
  npx prisma migrate deploy
  ```

- `prisma migrate deploy` will apply any pending SQL migration files from the `migrations` folder.

Rollback and safe changes

- Prisma's generated SQL migrations are the source of truth. To roll back a migration during development:
  - Use `npx prisma migrate resolve --rolled-back "<migration-id>"` to mark migrations.
  - Or restore your DB from a backup snapshot and reapply migrations.

- For destructive changes (dropping columns/tables):
  1. Add a migration that marks the column deprecated (keep compatibility).
  2. Deploy and let clients adapt.
  3. In a later migration, drop the column.

Seeding

- Keep seed scripts in `prisma/seed.js`. Use `node prisma/seed.js` to run.
- In CI, run seed scripts only for environments that require demo/test data.

Backup and migration safety

- Always take a DB snapshot (pg_dump) before applying migrations in production.
- Use feature flags if you need to toggle behavior while migrating.

Notes

- Keep migration files under version control.
- Use descriptive migration names.
- Avoid `migrate reset` in production.

Example commands (from `apps/api`):

```bash
# generate client
npx prisma generate

# create migration (dev)
npx prisma migrate dev --name init

# apply migrations (prod)
npx prisma migrate deploy

# run seed
node prisma/seed.js
```
