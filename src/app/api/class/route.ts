import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: '수업명을 입력해주세요.' }, { status: 400 });

    // Generate random 6 character code
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();

    const newClass = await prisma.class.create({
      data: {
        name,
        code,
        teacherId: session.userId,
      },
    });

    return NextResponse.json({ success: true, class: newClass });
  } catch (error) {
    console.error('Class creation error:', error);
    return NextResponse.json({ error: '수업 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
