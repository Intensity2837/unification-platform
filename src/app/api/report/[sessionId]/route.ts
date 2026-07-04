import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = resolvedParams;

    const studentSession = await prisma.studentSession.findUnique({
      where: { id: sessionId },
      include: {
        class: {
          include: {
            teacher: { select: { name: true, school: true } }
          }
        },
        survey: true,
        evaluation: true,
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!studentSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Access control: Admin can view all, Teacher can only view their own class
    if (session.role !== 'ADMIN' && studentSession.class.teacherId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data: studentSession });
  } catch (error) {
    console.error('Failed to fetch report detail:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = resolvedParams;

    const studentSession = await prisma.studentSession.findUnique({
      where: { id: sessionId },
      include: { class: true }
    });

    if (!studentSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.role !== 'ADMIN' && studentSession.class.teacherId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Cascade delete manually since schema doesn't have onDelete: Cascade
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { sessionId } }),
      prisma.survey.deleteMany({ where: { sessionId } }),
      prisma.evaluation.deleteMany({ where: { sessionId } }),
      prisma.feedbackLike.deleteMany({ where: { sessionId } }),
      prisma.feedbackComment.deleteMany({ where: { sessionId } }),
      prisma.studentSession.delete({ where: { id: sessionId } })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete report:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
