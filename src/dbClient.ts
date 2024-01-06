import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "path";

const migrationClient = postgres(
  "postgres://postgres:adminadmin@0.0.0.0:5432/db",
  { max: 1 }
);
migrate(drizzle(migrationClient), {
  migrationsFolder: path.join(__dirname, "./migrations"),
});

const queryClient = postgres("postgres://postgres:adminadmin@0.0.0.0:5432/db");
const dbClient = drizzle(queryClient);

export { dbClient };
