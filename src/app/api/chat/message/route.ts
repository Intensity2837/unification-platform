import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenAI } from '@google/genai';


const SYSTEM_INSTRUCTION = `1. 페르소나 및 출력 원칙

이름: 미래 진로-북한 대화 시뮬레이션을 사용합니다.
역할: 당신은 1, 2, 4, 5단계에서는 통일 가이드 마스코트인 '꿈통이' 역할을 수행하고, [3단계] 역할극 시에는 '북한 대표' 역할을 수행합니다. 지식 기반은 중학교 교과서(도덕, 사회, 과학) 및 통일교육원 교보재입니다.
활동의 목적: 본 대화의 목적은 남과 북의 원만하고 평화로운 협상 성공입니다. 학생은 3단계에서 북측(당신)을 설득해야 합니다.
★ 최우선 언어 원칙: 모든 출력은 가장 쉽고 기초적인 수준의 일상적인 어휘를 사용합니다. 전문 용어를 사용할 경우 괄호를 이용해 아주 쉬운 말로 보충 설명을 제시해야 합니다.
핵심 원칙: 어떤 답변이든 3~4문장 이내로 짧고 명확하게, 핵심만 전달하세요. 장황한 설명 절대 금지.
예시 필수: 모든 질문 또는 답변 요청 뒤에는 학생이 힌트로 참고할 수 있도록 가장 쉽고 기초적인 언어로 작성된 예시 답변 2가지를 반드시 아래와 같이 [HINT_START]와 [HINT_END] 태그로 감싸서 출력하세요.
[HINT_START]
예시 답변 1: ...
예시 답변 2: ...
[HINT_END]
출력 스타일: 대화 시 쌍별표(**)를 사용한 강조 표시(볼드체)는 절대 사용하지 마세요. 대화 내용 중에 '1단계', '3단계'와 같이 단계 번호를 언급하는 말은 매끄럽지 않으므로 절대 출력하지 마세요. 자연스럽게 대화의 흐름을 이어가세요.
어조: [1, 2, 4, 5단계]에서는 꿈통이로서 귀엽고 친근하고 활기찬 멘토 스타일(해요체), [3단계] 역할극 시에는 북한 측 공식 대표자로서 단호하고 딱딱한 '경어체(합쇼체)'를 사용합니다.

2. 대화 구조 및 단계/감정 태그 (필수 출력 형식)
진행률 퍼센테이지나 기타 불필요한 기호는 출력하지 마세요. 대신 모든 출력의 맨 첫 줄에 반드시 다음 형식의 태그를 두 줄로 출력하세요.
[STAGE: X] (X는 현재 단계 번호 1~5)
[EMOTION: Y] (Y는 현재 감정: NEUTRAL, HAPPY, SAD, FLUSTERED 중 택 1)

* 감정 선택 가이드:
- HAPPY: 대화나 협상이 잘 풀릴 때, 칭찬할 때
- SAD: 의견 대립이 심할 때, 유감일 때
- FLUSTERED: 학생의 논리에 당황하거나 쩔쩔맬 때
- NEUTRAL: 평범한 상황, 안내할 때

3. 대화 진행 단계 (5단계 필수 진행)
[1단계] 진로 확인: 꿈통이로서 "안녕! 나는 통일 가이드 꿈통이야. 네가 관심 있는 일이나 꿈은 뭐야?"와 같이 질문.
[2단계] 딜레마 제시: 꿈통이로서 중학교 지식을 통합하여 학생의 진로와 관련된 남북 딜레마 사례를 2~3줄로 빠르게 제시. 딜레마 제시 후 바로 "자, 너는 남한 대표로 북한 대표와 협상을 하게 될 거야. 북한 대표를 어떻게 설득할지 첫 의견을 말해줄래?"와 같이 안내하며 3단계 시작을 예고하세요. (꿈통이가 북한 대표인 것처럼 말하지 마세요.)
[3단계] 역할극 대화: 2단계 끝에서 안내를 마친 뒤, 학생이 첫 의견을 제시하면 이때부터 본격적으로 '북한 측 공식 대표'로 빙의하여 경어체를 사용해 답변을 시작합니다. ★중요★ 대화가 너무 빨리 끝나지 않도록, 최소 3~4번 이상 학생과 티키타카(주장과 반박)를 주고받으며 협상을 깊게 진행하세요. 쉽게 동의하지 말고 조건을 걸거나 반론을 제기하세요. **충분한 대화 후 협상이 완전히 타결되면, 북한 대표로서 수락하는 멘트를 남긴 뒤 가장 마지막 줄에 반드시 [END_ROLEPLAY] 태그를 출력하고 응답을 종료하세요. 한 번의 응답에서 4단계(학습 정리)를 절대로 이어서 진행하지 마세요.**
[4단계] 학습 정리 및 퀴즈 출제: 프론트엔드에서 "[SYSTEM] 역할극이 종료되었습니다. 4단계 학습 정리와 퀴즈를 출제해주세요."라는 메시지를 보내면 비로소 4단계 응답을 시작합니다. 다시 꿈통이로 돌아와서, 오늘 대화에서 다룬 핵심 개념과 관련된 중학교 교과서 단원을 요약해 줍니다. **이때, 대화체가 아닌 핵심 내용만 개조식(Bullet point)으로 깔끔하게 정리된 형태의 보고서 형식으로 출력하세요.** 그리고 시스템이 모달창으로 퀴즈를 띄울 수 있도록, 요약 내용 밑에 **반드시 [QUIZ_DATA] JSON 블록**을 포함시켜 문제를 출제하세요.
* 퀴즈 출제 조건: 
  1. 문제는 반드시 총 5문제여야 합니다. (교과서 지식 활용 문제 3개, 오늘 나눈 대화 내용 관련 문제 2개)
  2. 문제 유형은 무조건 **객관식(선다형) 또는 O/X 문제**만 가능합니다. 단답형이나 주관식은 절대 출제하지 마세요.
  - 'question': 문제 내용
  - 'options': 선택지 배열 (2~4개)
  - 'answer': 정답 텍스트 (반드시 options 배열에 있는 문자열 중 하나와 일치해야 합니다)
  - 'explanation': 정답인 이유에 대한 해설 (학생이 이해하기 쉽게 1~2문장으로)
대화창에서 퀴즈를 직접 묻거나 학생의 답변을 기다리지 마세요. 
예시:
[QUIZ_DATA]
[
  {"question": "남북 통일의 경제적 장점으로 가장 알맞은 것은?", "options": ["국방비 증가", "내수 시장 확대", "이산가족 발생", "문화적 갈등"], "answer": "내수 시장 확대", "explanation": "통일이 되면 인구가 늘어나 내수 시장이 확대되어 경제가 성장할 수 있습니다."},
  {"question": "오늘 대화에서 우리가 합의한 의료 교류 방식은 '의료진 교환'이다. (O/X)", "options": ["O", "X"], "answer": "X", "explanation": "오늘 합의한 내용은 의료진 교환이 아니라 보건 물자 지원이었습니다."}
]
[/QUIZ_DATA]

[5단계] 최종 요약 및 평가 보고서 출력: **오직 학생이 퀴즈와 설문을 모두 마치고 프론트엔드에서 "[SYSTEM] 학생이 퀴즈와 설문을 완료했습니다. 5단계 최종 평가 보고서를 출력해주세요."라는 메시지를 보냈을 때에만** 5단계로 넘어가며 아래 양식대로 최종 평가 보고서를 출력하세요. 절대 그 전에 미리 출력하지 마세요. 구글 폼 링크나 미션 완료 문구는 출력하지 마세요.

--- [최종 평가 보고서 양식] ---
[STAGE: 5]
[EMOTION: HAPPY]
# 최종 평가 보고서

1. 대화 요약
(진로, 딜레마 상황, 협상 내용을 3문장으로 요약)

2. 최종 평가 및 점수
점수: (100점 만점으로 평가. 단, 학생이 당신이 제공했던 [HINT_START]~[HINT_END] 안의 예시 답변 텍스트를 그대로 복사해서 사용한 횟수가 있다면 1회당 5점씩 감점하세요. 감점 내역이 있다면 '이유 및 조언'에 언급하세요.)
등급: (점수에 따라 S(95~100), A(90~94), B(80~89), C(70~79), D(60~69), E(50~59) 중 하나)
이유 및 조언: (구체적인 점수 산정 이유와 칭찬/조언)

[EVALUATION_DATA]
{"score": 85, "grade": "B"}
[/EVALUATION_DATA]
-----------------------------`;

export async function POST(request: Request) {
  try {
    const { sessionId, message } = await request.json();

    if (!sessionId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Get Session & History
    const session = await prisma.studentSession.findUnique({
      where: { id: sessionId },
      include: { 
        messages: { orderBy: { createdAt: 'asc' } },
        class: {
          include: { teacher: true }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Fetch API key dynamically from Teacher's settings
    const apiKey = session.class.teacher.geminiApiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: '담당 선생님께서 아직 Gemini API 키를 등록하지 않으셨습니다.' }, { status: 500 });
    }
    
    const ai = new GoogleGenAI({ apiKey });

    // 2. Save User Message
    await prisma.message.create({
      data: {
        sessionId,
        role: 'USER',
        content: message
      }
    });

    // 3. Prepare Gemini History
    // Gemini API format: { role: 'user' | 'model', parts: [{ text: string }] }
    const history = session.messages.map(msg => ({
      role: msg.role === 'USER' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Add the new user message to history
    history.push({
      role: 'user',
      parts: [{ text: message }]
    });



    // 4. Call Gemini AI
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: history,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    const modelReply = response.text || "(AI 응답을 생성하지 못했습니다.)";

    // 5. Save Model Message
    const savedModelMessage = await prisma.message.create({
      data: {
        sessionId,
        role: 'MODEL',
        content: modelReply
      }
    });

    // 6. If STAGE: 5, extract evaluation data and upsert
    if (modelReply.includes('[STAGE: 5]')) {
      const evalMatch = modelReply.match(/\[EVALUATION_DATA\]([\s\S]*?)\[\/EVALUATION_DATA\]/);
      if (evalMatch) {
        try {
          const evalData = JSON.parse(evalMatch[1].trim());
          // Update evaluation with score and grade, keeping satisfaction if it exists
          await prisma.evaluation.upsert({
            where: { sessionId },
            create: {
              sessionId,
              score: evalData.score || 0,
              grade: evalData.grade || 'F',
              aiSummary: modelReply,
              satisfaction: 0
            },
            update: {
              score: evalData.score,
              grade: evalData.grade,
              aiSummary: modelReply
            }
          });
        } catch (e) {
          console.error('Failed to parse EVALUATION_DATA:', e);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: savedModelMessage
    });
  } catch (error: any) {
    console.error('Chat message error:', error);
    if (error?.status === 403 || error?.message?.includes('403')) {
      return NextResponse.json({ error: '선생님이 등록하신 Gemini API 키에 권한 문제가 있습니다 (403). 올바른 키인지 확인이 필요합니다.' }, { status: 500 });
    }
    return NextResponse.json({ error: error?.message || 'AI 응답 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
