import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId }
  });
  
  return NextResponse.json({ 
    apiKey: user?.geminiApiKey || '' 
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { apiKey } = await request.json();
    
    await prisma.user.update({
      where: { id: session.userId },
      data: { geminiApiKey: apiKey }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save teacher setting error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
