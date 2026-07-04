import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || (session.role !== 'ADMIN' && session.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const whereClause = session.role === 'ADMIN' ? {} : { class: { teacherId: session.userId } };

    const studentSessions = await prisma.studentSession.findMany({
      where: whereClause,
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
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ data: studentSessions });
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
