import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    
    // Only Teacher can access
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    const whereClause: any = {
      class: {
        teacherId: session.userId
      }
    };

    if (classId) {
      whereClause.classId = classId;
    }

    // Fetch student sessions for the teacher's classes
    const studentSessions = await prisma.studentSession.findMany({
      where: whereClause,
      include: {
        class: true,
        survey: true,
        evaluation: true,
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ data: studentSessions });
  } catch (error) {
    console.error('Failed to fetch teacher reports:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
