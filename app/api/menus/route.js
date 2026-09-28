// app/api/menus/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

const getSecretKey = () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(process.env.JWT_SECRET);
};

const serialize = (obj) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const unauthorized = (message) =>
  NextResponse.json({ success: false, message }, { status: 401 });

export async function GET(request) {
  try {
    // 1. Token (header ya cookie)
    const authHeader = request.headers.get('authorization');
    const token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : request.cookies.get('accessToken')?.value;

    if (!token) return unauthorized('Unauthorized: No token provided.');

    // 2. Token se user id
    const { payload } = await jwtVerify(token, getSecretKey());
    const userId = Number(payload.id);
    if (!Number.isInteger(userId)) return unauthorized('Invalid token payload.');

    // 3. DB se us user ka latest role/status
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || Number(user.status) !== 1) {
      return unauthorized('User not found or inactive.');
    }

    const isAdmin = String(user.role).trim().toLowerCase() === 'admin';

    // 4. Role ke hisaab se menus filter
    const allMenus = await prisma.menu.findMany({ orderBy: { id: 'asc' } });

    const menus = allMenus
      .filter((m) => Number(m.status) === 1)
      .filter((m) => {
        const adminOnly = Number(m.adminOnly) === 1;
        return isAdmin
          ? adminOnly || m.href === '/dashboard' // admin: overview + admin links
          : !adminOnly;                          // user: sirf normal links
      })
      .map((m) => ({
        id: m.id,
        label: m.label,
        href: m.href,
        icon: m.icon,
        permission: m.permission,
        adminOnly: Number(m.adminOnly) === 1,
      }));

    // Dev mein terminal par dikhega ki kaun sa role kaun se menus le raha hai
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[menus] userId=${userId} dbRole=${user.role} isAdmin=${isAdmin} ->`,
        menus.map((m) => m.href)
      );
    }

    return NextResponse.json(
      { success: true, role: isAdmin ? 'admin' : 'user', data: serialize(menus) },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Menus Fetch Error:', error);
    return unauthorized('Invalid or expired token.');
  }
}