import { readFile, writeFile } from 'fs/promises';
import path from 'path';

export async function findUserByEmail(email: string) {
  const filePath = path.resolve(process.cwd(), 'src', 'lib', 'users.json');
  const data = await readFile(filePath, 'utf-8');
  const users = JSON.parse(data) as Array<any>;
  return users.find((u) => u.email === email);
}

export async function addUser(user: any) {
  const filePath = path.resolve(process.cwd(), 'src', 'lib', 'users.json');
  const data = await readFile(filePath, 'utf-8');
  const users = JSON.parse(data) as Array<any>;
  users.push(user);
  await writeFile(filePath, JSON.stringify(users, null, 2), 'utf-8');
}

export async function verifyPassword(plain: string, hash: string) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(plain, hash);
}
