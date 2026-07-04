import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { sessionId, authorName, content } = await request.json();

    if (!sessionId || !authorName || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newComment = await prisma.feedbackComment.create({
      data: {
        sessionId,
        authorName,
        content
      }
    });

    return NextResponse.json({ success: true, comment: newComment });
  } catch (error) {
    console.error('Comment API Error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
