import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { sessionId, q1, q2, q3, q4, q5, q6, finalReport, quizResults } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: '세션 ID가 없습니다.' }, { status: 400 });
    }

    // Save survey
    await prisma.survey.create({
      data: {
        sessionId,
        q1: parseInt(q1),
        q2: parseInt(q2),
        q3: parseInt(q3),
        q4: parseInt(q4),
        q5,
        q6,
      }
    });

    // Save satisfaction to evaluation (using upsert in case message route created it first, though unlikely)
    await prisma.evaluation.upsert({
      where: { sessionId },
      create: {
        sessionId,
        score: 0,
        satisfaction: parseInt(q1),
        grade: 'F',
      },
      update: {
        satisfaction: parseInt(q1),
      }
    });

    let quizScore = 0;
    if (quizResults && Array.isArray(quizResults)) {
      quizScore = quizResults.filter((r: any) => r.isCorrect).length;
    }

    // Update session status to COMPLETED and save quiz results
    await prisma.studentSession.update({
      where: { id: sessionId },
      data: { 
        status: 'COMPLETED',
        quizScore,
        quizAnswers: quizResults ? JSON.stringify(quizResults) : null
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Survey submit error:', error);
    return NextResponse.json({ error: '설문 저장 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
