import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { sessionId, likerName } = await request.json();

    if (!sessionId || !likerName) {
      return NextResponse.json({ error: 'Missing sessionId or likerName' }, { status: 400 });
    }

    // Check if like exists
    const existingLike = await prisma.feedbackLike.findUnique({
      where: {
        sessionId_likerName: {
          sessionId,
          likerName
        }
      }
    });

    if (existingLike) {
      // Remove like
      await prisma.feedbackLike.delete({
        where: { id: existingLike.id }
      });
      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      // Add like
      await prisma.feedbackLike.create({
        data: {
          sessionId,
          likerName
        }
      });
      return NextResponse.json({ success: true, action: 'added' });
    }
  } catch (error) {
    console.error('Like API Error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
