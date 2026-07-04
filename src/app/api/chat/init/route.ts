import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { code, studentNumber, name } = await request.json();

    if (!code || !studentNumber || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Find class
    const classData = await prisma.class.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!classData) {
      return NextResponse.json({ error: '유효하지 않은 수업 코드입니다.' }, { status: 404 });
    }

    // 2. Find or create StudentSession
    let session = await prisma.studentSession.findFirst({
      where: { classId: classData.id, studentNumber },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!session) {
      // Create new session
      session = await prisma.studentSession.create({
        data: {
          classId: classData.id,
          studentNumber,
          name,
          messages: {
            create: [
              {
                role: 'MODEL',
                content: `[STAGE: 1]\n[EMOTION: HAPPY]\n안녕, ${name}! 나는 '미래 진로-북한 대화 시뮬레이션'의 평화 통일 가이드 꿈통이야! 🌱\n우리는 앞으로 5단계(진로 확인 -> 딜레마 제시 -> 북한 대표와의 역할극 -> 학습 정리 및 퀴즈 -> 최종 평가)를 거치면서 통일 한반도에서의 평화로운 협상 방법을 배울 거야. 마지막에는 네 대화에 대한 최종 평가도 있으니 기대해!\n\n그럼 1단계를 시작할게. 네가 관심 있는 일이나 꿈은 뭐야?\n\n[HINT_START]\n예시 답변 1: "저는 사람들을 치료하는 의사가 되고 싶어요."\n예시 답변 2: "아직 확실하진 않지만, 컴퓨터 프로그래머에 관심이 있어요."\n[HINT_END]`
              }
            ]
          }
        },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });
    }

    return NextResponse.json({ 
      sessionId: session.id, 
      messages: session.messages 
    });
  } catch (error) {
    console.error('Chat init error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
