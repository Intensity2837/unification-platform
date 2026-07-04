import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getSession } from '@/lib/auth';

// Initialize Gemini API (Uses GEMINI_API_KEY from environment variables by default)
const ai = new GoogleGenAI({});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    
    // Only Admin can access this analysis API
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feedbackData } = await request.json();

    if (!feedbackData || !Array.isArray(feedbackData) || feedbackData.length === 0) {
      return NextResponse.json({ error: '분석할 데이터가 없습니다.' }, { status: 400 });
    }

    // Prepare prompt
    const prompt = `
당신은 교육 프로그램에 대한 학생들의 피드백을 분석하는 AI 교육 전문가입니다.
다음은 학생들이 제출한 주관식 설문 결과(좋았던 점, 아쉬웠던 점)입니다.

이 데이터를 분석하여 아래의 3가지 항목으로 정리해 주세요:
1. 긍정적인 의견 (학생들이 만족했던 주요 요인들)
2. 부정적인 의견 및 아쉬운 점 (학생들이 지적한 문제점이나 어려움)
3. 발전적 피드백 (좋은 점은 어떻게 더 발전시키고, 아쉬운 점은 어떻게 개선할 것인지 구체적인 방향성 제시)

출력 형식은 마크다운을 사용하여 깔끔하게 정리해 주세요.

[학생 피드백 데이터 시작]
${feedbackData.map((fb, idx) => `학생${idx+1} - 좋았던 점: ${fb.q5 || '없음'}, 아쉬웠던 점: ${fb.q6 || '없음'}`).join('\n')}
[학생 피드백 데이터 종료]
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '분석 결과를 생성하지 못했습니다.';

    return NextResponse.json({ summary: text });
  } catch (error) {
    console.error('Failed to analyze survey:', error);
    return NextResponse.json({ error: '분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
