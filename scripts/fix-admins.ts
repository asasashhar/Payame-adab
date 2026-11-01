/**
 * Ensure the three authorized Payam-e-Adab administrator accounts exist
 * with the initial password `darulhuda` (scrypt-hashed), per the upgrade spec.
 * Idempotent — safe to re-run. Does NOT touch non-admin data.
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const ADMINS = [
  { email: "mdnematullah1343@gmail.com", name: "محمد نعمت اللہ" },
  { email: "sadaemaqbul@gmail.com", name: "صداؑئہ مقبول" },
  { email: "payameadab@gmail.com", name: "پیامِ ادب" },
];

async function main() {
  for (const a of ADMINS) {
    const existing = await db.user.findUnique({ where: { email: a.email } });
    if (existing) {
      await db.user.update({
        where: { email: a.email },
        data: {
          passwordHash: hashPassword("darulhuda"),
          role: "ADMIN",
          status: "ACTIVE",
          mustChangePassword: true, // strongly encourage change after initial setup
        },
      });
      console.log(`UPDATED admin: ${a.email} (password reset to darulhuda, mustChange=true)`);
    } else {
      await db.user.create({
        data: {
          email: a.email,
          name: a.name,
          passwordHash: hashPassword("darulhuda"),
          role: "ADMIN",
          status: "ACTIVE",
          mustChangePassword: true,
        },
      });
      console.log(`CREATED admin: ${a.email}`);
    }
  }
  const count = await db.user.count({ where: { role: "ADMIN" } });
  console.log(`Total admins now: ${count}`);
}

main().then(() => db.$disconnect()).catch((e) => { console.error(e); process.exit(1); });
