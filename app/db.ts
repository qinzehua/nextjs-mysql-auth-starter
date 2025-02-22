import { drizzle } from "drizzle-orm/mysql2";
import { mysqlTable, serial, varchar } from "drizzle-orm/mysql-core";
import { eq } from "drizzle-orm";
import mysql from "mysql2/promise";
import { genSaltSync, hashSync } from "bcrypt-ts";

let pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "qzh123",
  database: "spiders",
  waitForConnections: true,
  connectionLimit: 10,
});

let db = drizzle(pool);

export async function getUser(email: string) {
  const users = await ensureTableExists();
  return await db.select().from(users).where(eq(users.email, email));
}

export async function createUser(email: string, password: string) {
  const users = await ensureTableExists();
  let salt = genSaltSync(10);
  let hash = hashSync(password, salt);

  return await db.insert(users).values({ email, password: hash });
}

async function ensureTableExists() {
  const conn = await pool.getConnection();
  try {
    const [rows]: [mysql.RowDataPacket[], mysql.FieldPacket[]] =
      await conn.query(
        `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'User';`
      );

    if (rows.length > 0 && rows[0].count === 0) {
      await conn.query(`
        CREATE TABLE User (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(64) NOT NULL,
          password VARCHAR(64) NOT NULL
        );
      `);
    }
  } finally {
    conn.release();
  }

  const table = mysqlTable("User", {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 64 }).notNull(),
    password: varchar("password", { length: 64 }).notNull(),
  });

  return table;
}
