import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await request.json();
  await prisma.user.update({ where: { id }, data: { isApproved: true } });
  return NextResponse.json({ success: true });
}
