import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Await params in next 15+ (although version is 14+, it's a good practice)
    const resolvedParams = await params;
    
    // Check if class belongs to teacher
    const classData = await prisma.class.findFirst({
      where: { id: resolvedParams.id, teacherId: session.userId }
    });

    if (!classData) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Fetch all student sessions and their messages
    const sessions = await prisma.studentSession.findMany({
      where: { classId: resolvedParams.id },
      include: { 
        messages: { orderBy: { createdAt: 'asc' } },
        evaluation: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error('Monitor API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
