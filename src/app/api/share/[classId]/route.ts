import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const resolvedParams = await params;
    const classCode = decodeURIComponent(resolvedParams.classId).toUpperCase().trim();

    const classData = await prisma.class.findUnique({
      where: { code: classCode },
      include: {
        studentSessions: {
          where: { status: 'COMPLETED' },
          include: {
            messages: { orderBy: { createdAt: 'asc' } },
            evaluation: true,
            survey: true,
            likes: true,
            comments: { orderBy: { createdAt: 'asc' } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!classData) {
      return NextResponse.json({ error: '유효하지 않은 수업 코드입니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, sessions: classData.studentSessions, className: classData.name });
  } catch (error) {
    console.error('Share API Error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
