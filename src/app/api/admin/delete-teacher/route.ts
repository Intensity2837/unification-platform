import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing teacher id' }, { status: 400 });
    }

    const teacher = await prisma.user.findUnique({
      where: { id, role: 'TEACHER' },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Since onDelete: Cascade is not set in Prisma schema, we must delete manually from bottom to top.
    
    // 1. Find all classes
    const classes = await prisma.class.findMany({ where: { teacherId: id }, select: { id: true } });
    const classIds = classes.map(c => c.id);

    // 2. Find all sessions in those classes
    const sessions = await prisma.studentSession.findMany({ where: { classId: { in: classIds } }, select: { id: true } });
    const sessionIds = sessions.map(s => s.id);

    // Run deletes in a transaction
    await prisma.$transaction([
      // Delete Messages, Evaluations, Surveys, Likes, Comments related to the sessions
      prisma.message.deleteMany({ where: { sessionId: { in: sessionIds } } }),
      prisma.evaluation.deleteMany({ where: { sessionId: { in: sessionIds } } }),
      prisma.survey.deleteMany({ where: { sessionId: { in: sessionIds } } }),
      prisma.feedbackLike.deleteMany({ where: { sessionId: { in: sessionIds } } }),
      prisma.feedbackComment.deleteMany({ where: { sessionId: { in: sessionIds } } }),

      // Delete Sessions
      prisma.studentSession.deleteMany({ where: { classId: { in: classIds } } }),

      // Delete Classes
      prisma.class.deleteMany({ where: { teacherId: id } }),

      // Delete Teacher
      prisma.user.delete({ where: { id } })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Teacher Error:', error);
    return NextResponse.json({ error: 'Failed to delete teacher' }, { status: 500 });
  }
}
