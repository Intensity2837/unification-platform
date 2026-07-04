import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    
    // Only Admin can access
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all student sessions with all required relations
    const studentSessions = await prisma.studentSession.findMany({
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
    console.error('Failed to fetch admin reports:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
