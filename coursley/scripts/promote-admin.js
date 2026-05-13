#!/usr/bin/env node
import postgres from 'postgres';
import argon2 from 'argon2';
import { randomUUID } from 'crypto';

// Usage: node scripts/promote-admin.js --email=admin@example.com --name="Admin User" [--password=secret]

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (const a of args) {
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      out[k] = v ?? true;
    }
  }
  return out;
}

async function main() {
  const { email, name, password } = parseArgs();
  if (!email) {
    console.error('Missing --email argument');
    process.exit(1);
  }
  if (!name) {
    console.error('Missing --name argument');
    process.exit(1);
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const sql = postgres(DATABASE_URL, { ssl: 'require' });

  try {
    const passwordHash = password ? await argon2.hash(password) : null;

    // Check existing user by email
    const existing = await sql`select id, email from "user" where email = ${email}`;
    if (existing.length > 0) {
      const id = existing[0].id;
      console.log(`User exists (id=${id}). Updating account, promoting to admin, and setting instructor role.`);
      if (passwordHash) {
        await sql`
          update "user"
          set name = ${name}, email = ${email}, "passwordHash" = ${passwordHash}, is_admin = true, role = 'instructor'
          where id = ${id}
        `;
      } else {
        await sql`
          update "user"
          set name = ${name}, email = ${email}, is_admin = true, role = 'instructor'
          where id = ${id}
        `;
      }
      console.log('Account update complete.');
      process.exit(0);
    }

    // Create new user
    const userId = randomUUID();
    const pwd = password || Math.random().toString(36).slice(2, 12);
    const newPasswordHash = passwordHash || (await argon2.hash(pwd));

    await sql`insert into "user" (id, name, email, "passwordHash", role, is_admin) values (${userId}, ${name}, ${email}, ${newPasswordHash}, 'instructor', true)`;

    console.log(`Created admin user ${email} with id ${userId}`);
    console.log('If you did not provide a password, a random password was generated (shown below). Save it securely:');
    console.log(pwd);
    process.exit(0);
  } catch (err) {
    console.error('Error promoting/creating admin user:', err);
    process.exit(2);
  } finally {
    try { await sql.end({ timeout: 1000 }); } catch (e) {}
  }
}

main();
