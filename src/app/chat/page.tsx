'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect, useRef } from 'react';
import Image from 'next/image';

function TypewriterText({ text, vocabDict }: { text: string, vocabDict?: Record<string, string> }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [text]);

  if (!vocabDict) {
    return <span style={{ whiteSpace: 'pre-wrap' }}>{displayedText}</span>;
  }

  // Vocab splitting logic
  const vocabKeys = Object.keys(vocabDict).sort((a, b) => b.length - a.length); // match longer words first
  const vocabRegex = new RegExp(`(${vocabKeys.join('|')})`, 'g');
  const parts = displayedText.split(vocabRegex);

  return (
    <span style={{ whiteSpace: 'pre-wrap' }}>
      {parts.map((part, i) => 
        vocabDict[part] ? (
          <span 
            key={i} 
            title={vocabDict[part]} 
            style={{ 
              textDecoration: 'underline dashed #fbbf24', 
              cursor: 'help',
              fontWeight: 'bold'
            }}
          >
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
}

function ChatContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const studentNumber = searchParams.get('number');
  const name = searchParams.get('name');
  const gender = searchParams.get('gender') || 'girl';

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{role: 'USER' | 'MODEL', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const initialized = useRef(false);
  const [cutInText, setCutInText] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [finalReportData, setFinalReportData] = useState<string | null>(null);
  const [learningSummaryData, setLearningSummaryData] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [currentEmotion, setCurrentEmotion] = useState<string>('NEUTRAL');
  const [assignedDelegate, setAssignedDelegate] = useState<string>('nk_delegate_transparent.png');
  const [isCutInPlaying, setIsCutInPlaying] = useState(false);

  // Quiz State
  const [quizData, setQuizData] = useState<any[] | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizInput, setQuizInput] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<{isCorrect: boolean, message: string} | null>(null);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [showQuizSummary, setShowQuizSummary] = useState(false);

  // Hints State
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [showHintModal, setShowHintModal] = useState(false);

  // Survey Form State
  const [q1, setQ1] = useState(0);
  const [q2, setQ2] = useState(0);
  const [q3, setQ3] = useState(0);
  const [q4, setQ4] = useState(0);
  const [q5, setQ5] = useState('');
  const [q6, setQ6] = useState('');

  const VOCAB_DICT: Record<string, string> = {
    "우리식 사회주의": "북한 고유의 사회주의 체제로, 주체사상을 바탕으로 우리식대로 살아가자는 정치 이념입니다.",
    "인도주의": "인간의 존엄성을 최고의 가치로 여기고 인종, 민족, 국가를 초월하여 인류의 복지와 행복을 추구하는 사상입니다.",
    "주체사상": "자신의 운명의 주인은 자신이라는 북한의 통치 이념입니다.",
    "고난의 행군": "1990년대 중반, 북한에서 경제적 어려움과 식량난으로 수많은 사람들이 굶주렸던 시기를 말합니다.",
    "천리마 운동": "1950년대 북한에서 경제 발전을 위해 시작된 대중 동원 운동으로, 천리마처럼 빠르게 발전하자는 의미입니다.",
    "남북기본합의서": "1991년 남북한이 상호 체제 인정, 상호 불가침, 교류 협력 등을 합의한 공식 문서입니다."
  };

  useEffect(() => {
    if (!code || !studentNumber || !name) return;
    if (initialized.current) return;
    initialized.current = true;
    
    document.title = '꿈통 시그널: 남북 딜레마 협상';

    const delegates = ['nk_delegate_transparent.png', 'nk_delegate_female_transparent.png', 'nk_delegate_old_transparent.png'];
    setAssignedDelegate(delegates[Math.floor(Math.random() * delegates.length)]);

    // Initialize session
    fetch('/api/chat/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, studentNumber, name })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }
      setSessionId(data.sessionId);
      
      let lastStage = 1;
      let lastEmotion = 'NEUTRAL';
      let loadedHint: string | null = null;
      let loadedQuiz: any = null;

      const cleanMessages = data.messages.map((m: any) => {
        let cleanText = m.content;
        
        const stageMatch = cleanText.match(/\[STAGE:\s*(\d+)\]/);
        if (stageMatch) lastStage = parseInt(stageMatch[1], 10);
        
        const emotionMatch = cleanText.match(/\[EMOTION:\s*([A-Z]+)\]/i);
        if (emotionMatch) lastEmotion = emotionMatch[1].toUpperCase();

        cleanText = cleanText.replace(/\*\*/g, '').replace(/\[STAGE:\s*\d+\]/g, '').replace(/\[EMOTION:\s*[A-Z]+\]/gi, '').trim();

        const quizMatch = cleanText.match(/\[QUIZ_DATA\]([\s\S]*?)\[\/QUIZ_DATA\]/);
        if (quizMatch) {
          try { loadedQuiz = JSON.parse(quizMatch[1].trim()); } catch (e) {}
          cleanText = cleanText.replace(/\[QUIZ_DATA\][\s\S]*?\[\/QUIZ_DATA\]/, '').trim();
        }

        const hintMatch = cleanText.match(/\[HINT_START\]([\s\S]*?)\[HINT_END\]/);
        if (hintMatch) {
          loadedHint = hintMatch[1].trim();
          cleanText = cleanText.replace(/\[HINT_START\][\s\S]*?\[HINT_END\]/, '').trim();
        } else if (m.role === 'MODEL') {
          loadedHint = null; // Reset hint if the latest model message has no hint
        }

        const endRoleplayMatch = cleanText.includes('[END_ROLEPLAY]');
        if (endRoleplayMatch) {
          cleanText = cleanText.replace(/\[END_ROLEPLAY\]/g, '').trim();
        }

        return { ...m, content: cleanText };
      });
      
      setCurrentStage(lastStage);
      setCurrentEmotion(lastEmotion);
      setCurrentHint(loadedHint);
      if (loadedQuiz) setQuizData(loadedQuiz);
      
      setMessages(cleanMessages);
    })
    .catch(console.error);
  }, [code, studentNumber, name]);

  const handleSend = async () => {
    if (!input.trim() || !sessionId || isLoading || isCutInPlaying) return;
    
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'USER', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: userMessage })
      });
      const data = await res.json();
      
      if (data.success) {
        let rawContent = data.message.content;
        
        const stageMatch = rawContent.match(/\[STAGE:\s*(\d+)\]/);
        const emotionMatch = rawContent.match(/\[EMOTION:\s*([A-Z]+)\]/i);
        
        if (emotionMatch) {
          setCurrentEmotion(emotionMatch[1].toUpperCase());
        }

        let cleanContent = rawContent.replace(/\*\*/g, '').replace(/\[STAGE:\s*\d+\]/g, '').replace(/\[EMOTION:\s*[A-Z]+\]/gi, '').trim();

        // Extract Quiz Data
        const quizMatch = cleanContent.match(/\[QUIZ_DATA\]([\s\S]*?)\[\/QUIZ_DATA\]/);
        if (quizMatch) {
          try {
            const parsedQuiz = JSON.parse(quizMatch[1].trim());
            setQuizData(parsedQuiz);
          } catch (e) {
            console.error('Failed to parse quiz JSON', e);
          }
          cleanContent = cleanContent.replace(/\[QUIZ_DATA\][\s\S]*?\[\/QUIZ_DATA\]/, '').trim();
        }

        // Extract Hint Data
        const hintMatch = cleanContent.match(/\[HINT_START\]([\s\S]*?)\[HINT_END\]/);
        if (hintMatch) {
          setCurrentHint(hintMatch[1].trim());
          cleanContent = cleanContent.replace(/\[HINT_START\][\s\S]*?\[HINT_END\]/, '').trim();
        } else {
          setCurrentHint(null);
        }

        // Extract END_ROLEPLAY
        const endRoleplayMatch = cleanContent.includes('[END_ROLEPLAY]');
        if (endRoleplayMatch) {
          cleanContent = cleanContent.replace(/\[END_ROLEPLAY\]/g, '').trim();
        }

        if (stageMatch) {
          const stageNum = parseInt(stageMatch[1], 10);
          
          if (stageNum === 4) {
            setLearningSummaryData(cleanContent);
          }

          if (stageNum !== currentStage) {
            setCurrentStage(stageNum);
            
            // Set animation duration
            const cutInDelay = 3500;
            setIsCutInPlaying(true);
            
            if (stageNum === 1) triggerCutIn('진로 멘토링 시작!');
            else if (stageNum === 2) triggerCutIn('딜레마 제시!');
            else if (stageNum === 3) triggerCutIn('본격적인 협상 시작!');
            else if (stageNum === 4) triggerCutIn('학습 정리');
            else if (stageNum === 5) {
              setFinalReportData(cleanContent);
              setShowSurvey(true);
              setIsLoading(false);
              setIsCutInPlaying(false);
              return; 
            }

            setTimeout(() => {
              setMessages(prev => [...prev, { role: 'MODEL', content: cleanContent }]);
              setIsCutInPlaying(false);
              setIsLoading(false);
              
              if (endRoleplayMatch) {
                // Automatically send system message to proceed to stage 4
                setIsLoading(true);
                fetch('/api/chat/message', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sessionId, message: "[SYSTEM] 역할극이 종료되었습니다. 4단계 학습 정리와 퀴즈를 출제해주세요." })
                }).then(res => res.json()).then(sysData => {
                  if (sysData.success) {
                    let sysContent = sysData.message.content;
                    const sysStageMatch = sysContent.match(/\[STAGE:\s*(\d+)\]/);
                    const sysEmotionMatch = sysContent.match(/\[EMOTION:\s*([A-Z]+)\]/i);
                    if (sysEmotionMatch) setCurrentEmotion(sysEmotionMatch[1].toUpperCase());
                    let cleanSys = sysContent.replace(/\*\*/g, '').replace(/\[STAGE:\s*\d+\]/g, '').replace(/\[EMOTION:\s*[A-Z]+\]/gi, '').trim();
                    
                    const sysQuizMatch = cleanSys.match(/\[QUIZ_DATA\]([\s\S]*?)\[\/QUIZ_DATA\]/);
                    if (sysQuizMatch) {
                      try { setQuizData(JSON.parse(sysQuizMatch[1].trim())); } catch (e) {}
                      cleanSys = cleanSys.replace(/\[QUIZ_DATA\][\s\S]*?\[\/QUIZ_DATA\]/, '').trim();
                    }
                    
                    if (sysStageMatch) {
                      const sysStageNum = parseInt(sysStageMatch[1], 10);
                      if (sysStageNum === 4) {
                        setLearningSummaryData(cleanSys);
                        setCurrentStage(4);
                        setIsCutInPlaying(true);
                        triggerCutIn('학습 정리');
                        setTimeout(() => {
                          setMessages(prev => [...prev, { role: 'MODEL', content: cleanSys }]);
                          setIsCutInPlaying(false);
                          setIsLoading(false);
                        }, 3500);
                        return;
                      }
                    }
                    setMessages(prev => [...prev, { role: 'MODEL', content: cleanSys }]);
                  }
                  setIsLoading(false);
                });
              }
            }, cutInDelay);
            return; // Return early as we handled it via setTimeout
          } else if (stageNum === 5) {
            setFinalReportData(cleanContent);
            setShowSurvey(true);
            setIsLoading(false);
            return;
          }
        }
        
        setMessages(prev => [...prev, { role: 'MODEL', content: cleanContent }]);
        
        if (endRoleplayMatch && stageMatch && parseInt(stageMatch[1], 10) === currentStage) {
          // If stage didn't change but roleplay ended
          setIsLoading(true);
          fetch('/api/chat/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, message: "[SYSTEM] 역할극이 종료되었습니다. 4단계 학습 정리와 퀴즈를 출제해주세요." })
          }).then(res => res.json()).then(sysData => {
            if (sysData.success) {
              let sysContent = sysData.message.content;
              const sysStageMatch = sysContent.match(/\[STAGE:\s*(\d+)\]/);
              const sysEmotionMatch = sysContent.match(/\[EMOTION:\s*([A-Z]+)\]/i);
              if (sysEmotionMatch) setCurrentEmotion(sysEmotionMatch[1].toUpperCase());
              let cleanSys = sysContent.replace(/\*\*/g, '').replace(/\[STAGE:\s*\d+\]/g, '').replace(/\[EMOTION:\s*[A-Z]+\]/gi, '').trim();
              
              const sysQuizMatch = cleanSys.match(/\[QUIZ_DATA\]([\s\S]*?)\[\/QUIZ_DATA\]/);
              if (sysQuizMatch) {
                try { setQuizData(JSON.parse(sysQuizMatch[1].trim())); } catch (e) {}
                cleanSys = cleanSys.replace(/\[QUIZ_DATA\][\s\S]*?\[\/QUIZ_DATA\]/, '').trim();
              }
              
              if (sysStageMatch) {
                const sysStageNum = parseInt(sysStageMatch[1], 10);
                if (sysStageNum === 4) {
                  setLearningSummaryData(cleanSys);
                  setCurrentStage(4);
                  setIsCutInPlaying(true);
                  triggerCutIn('학습 정리');
                  setTimeout(() => {
                    setMessages(prev => [...prev, { role: 'MODEL', content: cleanSys }]);
                    setIsCutInPlaying(false);
                    setIsLoading(false);
                  }, 3500);
                  return;
                }
              }
              setMessages(prev => [...prev, { role: 'MODEL', content: cleanSys }]);
            }
            setIsLoading(false);
          });
        }
      } else {
        if (data.error && (data.error.includes('429') || data.error.includes('Quota'))) {
          alert('현재 접속자가 많아 AI 응답이 지연되고 있습니다. 10초 후에 다시 답변을 입력해주세요!');
        } else {
          alert(data.error || '오류가 발생했습니다.');
        }
      }
    } catch (e) {
      alert('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      console.error(e);
    } finally {
      if (!isCutInPlaying) {
        setIsLoading(false);
      }
    }
  };

  const submitSurvey = async () => {
    if (!q1 || !q2 || !q3 || !q4) {
      alert('설문 1번부터 4번까지 모든 객관식 문항에 응답해 주세요.');
      return;
    }
    if (!q5.trim()) {
      alert('설문 5번 문항(흥미로웠던 부분)을 작성해 주세요!');
      return;
    }

    const confirmSubmit = confirm('설문에 응답하신 내용이 맞는지 다시 한 번 확인해주세요.\n선택하신 점수(1~5점)와 작성하신 답변이 정확합니까?\n\n[확인] 제출하기\n[취소] 다시 확인하기');
    if (!confirmSubmit) return;
    
    setIsLoading(true);

    try {
      // 1. Save survey
      await fetch('/api/chat/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          q1, q2, q3, q4, q5, q6,
          quizResults
        })
      });

      // 2. Request Final Report
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId, 
          message: "[SYSTEM] 학생이 퀴즈와 설문을 완료했습니다. 5단계 최종 평가 보고서를 출력해주세요." 
        })
      });
      const data = await res.json();
      
      if (data.success) {
        let rawContent = data.message.content;
        const cleanContent = rawContent.replace(/\*\*/g, '').replace(/\[STAGE:\s*\d+\]/g, '').replace(/\[EMOTION:\s*[A-Z]+\]/gi, '').trim();
        setFinalReportData(cleanContent);
        setCurrentStage(5);
        setShowReport(true);
        setShowSurvey(false);
      } else {
        alert(data.error || '최종 보고서를 생성하는 중 오류가 발생했습니다.');
        setShowSurvey(false);
      }
    } catch (e) {
      console.error(e);
      alert('네트워크 오류가 발생했습니다.');
      setShowSurvey(false);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerCutIn = (text: string) => {
    setCutInText(text);
    setTimeout(() => setCutInText(null), 3500);
  };

  if (!code || !studentNumber || !name) {
    return <div style={{ padding: '2rem' }}>잘못된 접근입니다. 수업 코드와 인적사항을 확인해주세요.</div>;
  }

  const latestMessage = messages[messages.length - 1];
  const isModelTalking = latestMessage?.role === 'MODEL' || isLoading || isCutInPlaying;
  const isUserTalking = latestMessage?.role === 'USER' && !isLoading && !isCutInPlaying;

  // Determine avatar src and styles based on emotion
  let avatarSrc = "/images/kkumtong_avatar_transparent.png";
  if (currentStage === 3) {
    avatarSrc = `/images/${assignedDelegate}`;
  }

  let emotionStyle: React.CSSProperties = { maxHeight: '100%', objectFit: 'contain', transition: 'all 0.5s' };
  if (currentEmotion === 'HAPPY') {
    emotionStyle.filter = 'drop-shadow(0 0 20px rgba(255,215,0,0.8)) brightness(1.1) saturate(1.2)';
    emotionStyle.animation = 'bounce 2s infinite';
  } else if (currentEmotion === 'SAD') {
    emotionStyle.filter = 'grayscale(0.6) brightness(0.8) sepia(0.2)';
  } else if (currentEmotion === 'FLUSTERED') {
    emotionStyle.filter = 'contrast(1.2) hue-rotate(-10deg)';
    emotionStyle.animation = 'shake 0.5s infinite';
  }

  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      background: '#000'
    }}>
      {/* Background Image */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: 'url(/images/debate_room_bg2.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: showLog ? 0.3 : 1,
        transition: 'opacity 0.3s'
      }} />

      {/* Stage Badge */}
      <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 10 }}>
        <div style={{ 
          background: 'rgba(30, 58, 138, 0.9)', color: '#fff', 
          padding: '10px 20px', borderRadius: '25px', 
          fontWeight: 'bold', fontSize: '1.2rem',
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
          border: '2px solid rgba(255,255,255,0.3)'
        }}>
          {currentStage === 1 && '🌱 1단계: 진로 멘토링 중'}
          {currentStage === 2 && '⚖️ 2단계: 딜레마 제시 중'}
          {currentStage === 3 && '🤝 3단계: 북한 대표와 협상 중'}
          {currentStage === 4 && '📚 4단계: 학습 정리 중'}
          {currentStage === 5 && '📝 5단계: 최종 평가'}
        </div>
      </div>

      {/* Character Sprite */}
      {!showLog && (
        <div style={{
          position: 'absolute',
          bottom: '25%', // Above the dialog box
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          height: '70%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          pointerEvents: 'none',
          transition: 'all 0.3s'
        }}>
          {isModelTalking && (
            <img 
              src={avatarSrc} 
              alt={currentStage === 3 ? "북한 대표" : "꿈통이"}
              style={emotionStyle}
            />
          )}
          {isUserTalking && (
            <img 
              src={gender === 'boy' ? "/images/student_avatar_boy_transparent.png" : "/images/student_avatar_transparent.png"} 
              alt="학생"
              style={{ maxHeight: '100%', objectFit: 'contain' }}
            />
          )}
        </div>
      )}

      {/* Cut-in Animation Overlay */}
      {cutInText && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent',
          zIndex: 50,
          pointerEvents: 'none',
          animation: 'flashBg 3.5s ease-in-out forwards'
        }}>
          <div style={{
            background: 'var(--primary)',
            color: '#fff',
            padding: '2rem 4rem',
            fontSize: '4rem',
            fontWeight: '900',
            textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
            transform: 'skewX(-15deg)',
            borderTop: '10px solid #fff',
            borderBottom: '10px solid #fff',
            animation: 'slideInRight 3.5s cubic-bezier(0.25, 1, 0.5, 1) forwards'
          }}>
            <div style={{ transform: 'skewX(15deg)' }}>
              {cutInText}
            </div>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes slideInRight {
              0% { transform: translateX(100vw) skewX(-15deg); opacity: 0; }
              15% { transform: translateX(0) skewX(-15deg); opacity: 1; }
              85% { transform: translateX(0) skewX(-15deg); opacity: 1; }
              100% { transform: translateX(-100vw) skewX(-15deg); opacity: 0; }
            }
            @keyframes flashBg {
              0% { background: transparent; }
              10% { background: rgba(0,0,0,0.5); }
              90% { background: rgba(0,0,0,0.5); }
              100% { background: transparent; }
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-15px); }
            }
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-5px); }
              75% { transform: translateX(5px); }
            }
          `}} />
        </div>
      )}

      {/* Log Overlay */}
      {showLog && (
        <div style={{
          position: 'absolute',
          top: '5%', left: '10%', width: '80%', height: '70%',
          background: 'rgba(0,0,0,0.8)',
          borderRadius: '16px',
          padding: '2rem',
          overflowY: 'auto',
          color: '#fff',
          border: '2px solid rgba(255,255,255,0.2)',
          zIndex: 40
        }}>
          <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid #555', paddingBottom: '0.5rem' }}>대화 기록</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ 
                alignSelf: m.role === 'USER' ? 'flex-end' : 'flex-start',
                background: m.role === 'USER' ? 'var(--primary)' : '#333',
                padding: '12px 16px',
                borderRadius: '12px',
                maxWidth: '80%',
                lineHeight: 1.5
              }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '4px' }}>
                  {m.role === 'USER' ? name : (currentStage === 3 ? '북한 대표' : '꿈통이')}
                </div>
                <div>{m.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Controls */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
        <button 
          className="glass-button" 
          onClick={() => setShowLog(!showLog)}
          style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
        >
          {showLog ? '닫기' : '대화 기록 (Log)'}
        </button>
      </div>

      {/* Visual Novel Dialog Box */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '1000px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        zIndex: 10,
        transition: 'all 0.3s ease-in-out'
      }}>
        
        {/* Name Tag and Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          alignSelf: 'flex-start',
          width: '100%'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #1e3a8a 100%)',
            color: '#fff',
            padding: '8px 24px',
            borderRadius: '8px 8px 0 0',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            border: '2px solid rgba(255,255,255,0.2)',
            borderBottom: 'none'
          }}>
            {isLoading ? '입력 중...' : (latestMessage?.role === 'MODEL' ? (currentStage === 3 ? '북한 대표' : '꿈통이') : name)}
          </div>
          
          {/* Expand/Collapse Button */}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              border: '2px solid rgba(255,255,255,0.2)',
              borderBottom: 'none',
              borderRadius: '8px 8px 0 0',
              padding: '4px 16px',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            {isExpanded ? '🔽 축소하기' : '🔼 펼쳐보기'}
          </button>
        </div>

        {/* Text Box */}
        <div style={{
          background: 'rgba(10, 15, 30, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '0 12px 12px 12px',
          padding: '1.5rem',
          color: '#fff',
          height: isExpanded ? '50vh' : '220px',
          transition: 'height 0.3s ease-in-out',
          fontSize: '1.2rem',
          lineHeight: 1.6,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem' }}>
            {isLoading ? (
              <span style={{ fontStyle: 'italic', color: '#aaa' }}>...</span>
            ) : (
              latestMessage?.role === 'MODEL' ? 
                <TypewriterText text={latestMessage.content} vocabDict={VOCAB_DICT} /> : 
                <span style={{ whiteSpace: 'pre-wrap' }}>{latestMessage?.content}</span>
            )}
          </div>

          {/* Input Area */}
          <div className="chat-input-container" style={{ 
            marginTop: '1rem', 
            borderTop: '1px solid rgba(255,255,255,0.2)', 
            paddingTop: '1rem'
          }}>
            {currentHint && (
              <button 
                onClick={() => setShowHintModal(true)}
                style={{
                  background: '#fef08a', color: '#854d0e', border: 'none', 
                  padding: '12px 16px', borderRadius: '8px', 
                  fontWeight: 'bold', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                💡 힌트 보기
              </button>
            )}

            {currentStage === 4 && quizData && quizData.length > 0 ? (
              <button 
                onClick={() => setShowQuizModal(true)}
                style={{
                  width: '100%',
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📝 퀴즈 풀기
              </button>
            ) : (
              <>
                <input 
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1.1rem',
                    outline: 'none'
                  }}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="여기에 답변을 입력하세요..." 
                  disabled={isLoading || isCutInPlaying || currentStage === 5}
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim() || isCutInPlaying || currentStage === 5}
                  style={{
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    padding: '0 24px',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                    opacity: isLoading || !input.trim() ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  제시하기!
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hint Modal */}
      {showHintModal && currentHint && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.6)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="animate-fade-in" style={{
            background: '#fff', width: '90%', maxWidth: '600px',
            borderRadius: '16px', display: 'flex', flexDirection: 'column', color: '#000',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)', padding: '2rem'
          }}>
            <h2 style={{ color: '#854d0e', marginTop: 0, borderBottom: '2px dashed #fef08a', paddingBottom: '0.5rem' }}>
              💡 예시 답변 힌트
            </h2>
            <div style={{ fontSize: '1.1rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
              {currentHint}
            </div>
            <button 
              onClick={() => setShowHintModal(false)}
              style={{
                marginTop: '2rem', background: '#e2e8f0', color: '#475569', border: 'none', 
                padding: '12px 24px', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold',
                cursor: 'pointer', alignSelf: 'flex-end'
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && quizData && quizData.length > 0 && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.85)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            background: 'rgba(15, 23, 42, 0.95)', padding: '3rem', width: '90%', maxWidth: '600px',
            borderRadius: '16px', color: '#fff',
            border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            textAlign: 'center'
          }}>
            {showQuizSummary ? (
              <div style={{ animation: 'fadeIn 0.5s ease-out', padding: '2rem 0' }}>
                <h2 style={{ color: '#fbbf24', marginBottom: '1.5rem', textAlign: 'center', fontSize: '2.5rem' }}>
                  🎉 퀴즈 도전 완료!
                </h2>
                <p style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
                  총 {quizData.length}문제 중 <span style={{ color: '#10b981', fontWeight: 'bold' }}>{quizResults.filter(r => r.isCorrect).length}문제</span>를 맞췄습니다!
                </p>
                <p style={{ textAlign: 'center', fontSize: '1.2rem', marginBottom: '2.5rem', color: '#cbd5e1' }}>
                  {quizResults.filter(r => r.isCorrect).length === quizData.length ? '완벽해요! 북한 마스터가 되셨군요! 🏆' : 
                   quizResults.filter(r => r.isCorrect).length >= Math.ceil(quizData.length / 2) ? '잘 하셨어요! 대단한 실력이네요! 👍' : 
                   '조금 아쉽지만 훌륭한 도전이었어요! 다음 단계로 가볼까요? 💪'}
                </p>
                <button 
                  onClick={() => {
                    setShowQuizModal(false);
                    setShowQuizSummary(false);
                    setShowSurvey(true);
                  }}
                  style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '1.2rem', width: '100%', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
                >
                  설문조사로 이동하기 ➡️
                </button>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#10b981' }}>📝 학습 퀴즈 ({currentQuizIndex + 1}/{quizData.length})</h2>
                <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
                  {quizData[currentQuizIndex].question}
                </p>

            {quizData[currentQuizIndex].options ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {quizData[currentQuizIndex].options.map((opt: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => {
                      const isCorrect = opt === quizData[currentQuizIndex].answer || opt.includes(quizData[currentQuizIndex].answer) || quizData[currentQuizIndex].answer.includes(opt);
                      if (isCorrect) {
                        setQuizFeedback({ isCorrect: true, message: '정답입니다! 🎉' });
                      } else {
                        setQuizFeedback({ isCorrect: false, message: `틀렸습니다! 정답은 [${quizData[currentQuizIndex].answer}] 입니다.` });
                      }
                      setQuizResults(prev => [...prev, {
                        question: quizData[currentQuizIndex].question,
                        correctAnswer: quizData[currentQuizIndex].answer,
                        studentAnswer: opt,
                        isCorrect
                      }]);
                    }}
                    disabled={!!quizFeedback}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      padding: '16px',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '1.1rem',
                      cursor: quizFeedback ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => { if(!quizFeedback) e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
                    onMouseOut={(e) => { if(!quizFeedback) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ marginBottom: '2rem' }}>
                <input
                  type="text"
                  value={quizInput}
                  onChange={(e) => setQuizInput(e.target.value)}
                  disabled={!!quizFeedback}
                  placeholder="정답을 입력하세요..."
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    padding: '16px',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1.2rem',
                    outline: 'none',
                    textAlign: 'center'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !quizFeedback && quizInput.trim()) {
                      const correctAns = quizData[currentQuizIndex].answer.toString().trim();
                      const isCorrect = quizInput.trim().includes(correctAns) || correctAns.includes(quizInput.trim());
                      if (isCorrect) {
                        setQuizFeedback({ isCorrect: true, message: '정답입니다! 🎉' });
                      } else {
                        setQuizFeedback({ isCorrect: false, message: `틀렸습니다! 정답은 [${correctAns}] 에 가깝습니다.` });
                      }
                      setQuizResults(prev => [...prev, {
                        question: quizData[currentQuizIndex].question,
                        correctAnswer: correctAns,
                        studentAnswer: quizInput.trim(),
                        isCorrect
                      }]);
                    }
                  }}
                />
                {!quizFeedback && (
                  <button 
                    onClick={() => {
                      const correctAns = quizData[currentQuizIndex].answer.toString().trim();
                      const isCorrect = quizInput.trim().includes(correctAns) || correctAns.includes(quizInput.trim());
                      if (isCorrect) {
                        setQuizFeedback({ isCorrect: true, message: '정답입니다! 🎉' });
                      } else {
                        setQuizFeedback({ isCorrect: false, message: `틀렸습니다! 정답은 [${correctAns}] 에 가깝습니다.` });
                      }
                      setQuizResults(prev => [...prev, {
                        question: quizData[currentQuizIndex].question,
                        correctAnswer: correctAns,
                        studentAnswer: quizInput.trim(),
                        isCorrect
                      }]);
                    }}
                    disabled={!quizInput.trim()}
                    style={{ marginTop: '1rem', background: '#3b82f6', color: '#fff', padding: '12px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}
                  >
                    확인
                  </button>
                )}
              </div>
            )}

            {quizFeedback && (
              <div className="animate-fade-in" style={{
                background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.5rem',
                border: `2px solid ${quizFeedback.isCorrect ? '#10b981' : '#ef4444'}`,
                marginBottom: '2rem',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: quizFeedback.isCorrect ? '#34d399' : '#f87171',
                textAlign: 'center', lineHeight: 1.5 
              }}>
                {quizFeedback.message}
                {quizData && quizData[currentQuizIndex] && quizData[currentQuizIndex].explanation && (
                  <div style={{ marginTop: '1rem', fontSize: '1rem', color: '#cbd5e1', textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                    <strong>💡 해설:</strong> {quizData[currentQuizIndex].explanation}
                  </div>
                )}
              </div>
            )}

            {quizFeedback && (
              <button
                onClick={() => {
                  setQuizFeedback(null);
                  setQuizInput('');
                  if (currentQuizIndex + 1 < quizData.length) {
                    setCurrentQuizIndex(currentQuizIndex + 1);
                  } else {
                    setShowQuizSummary(true);
                  }
                }}
                style={{
                  background: 'var(--primary)', color: '#fff', border: 'none', padding: '12px 32px',
                  borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                {currentQuizIndex + 1 < quizData.length ? '다음 문제 ➡️' : '결과 보기 ➡️'}
              </button>
            )}
            </>
            )}
          </div>
        </div>
      )}

      {/* Survey Modal */}
      {showSurvey && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.85)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            background: 'rgba(15, 23, 42, 0.95)', padding: '3rem', width: '90%', maxWidth: '700px',
            maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', color: '#fff',
            border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            {isLoading ? (
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', color: '#60a5fa', marginBottom: '1.5rem' }}>잠시만 기다려 주세요...</h2>
                <p style={{ fontSize: '1.2rem', color: '#cbd5e1', marginBottom: '3rem' }}>
                  최종 평가 보고서를 만들고 있습니다.<br/>(약 10초 ~ 15초 소요)
                </p>
                <div style={{ 
                  width: '60px', height: '60px', 
                  border: '6px solid rgba(255,255,255,0.1)', 
                  borderTop: '6px solid #3b82f6', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite', 
                  margin: '0 auto' 
                }} />
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#60a5fa', textAlign: 'center' }}>🎉 수고하셨습니다! 설문조사</h2>
                <p style={{ marginBottom: '2rem', color: '#cbd5e1', textAlign: 'center' }}>
                  모든 과정이 끝났습니다. 최종 평가 보고서를 확인하기 전, 아래 설문에 참여해 주세요.
                </p>

                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '2rem' }}>
                  <p style={{ color: '#fca5a5', fontWeight: 'bold', margin: 0 }}>
                    ⚠️ 주의사항: 객관식 문항의 가장 왼쪽은 '매우 그렇다(5점)'입니다. 점수를 잘못 체크하지 않도록 선지를 잘 확인해주세요!
                  </p>
                </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {[
                { label: '설문1. 나는 프로그램에 적극적이고 능동적으로 참여하였다.', state: q1, set: setQ1 },
                { label: '설문2. 나라사랑‧통일 이야기 한마당이 통일 및 평화에 대한 관심을 높이는데 도움이 되었다.', state: q2, set: setQ2 },
                { label: '설문3. 나라사랑‧통일 이야기 한마당을 통해 평화의 중요성과 필요성에 대해 공감하게 되었다.', state: q3, set: setQ3 },
                { label: '설문4. 앞으로 나라사랑‧통일 관련 프로그램에 다양하게 참여하고 싶다.', state: q4, set: setQ4 }
              ].map((q, idx) => (
                <div key={idx}>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{q.label}</p>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {[
                      { text: '매우 그렇다', val: 5 },
                      { text: '그렇다', val: 4 },
                      { text: '보통이다', val: 3 },
                      { text: '그렇지 않다', val: 2 },
                      { text: '매우 그렇지 않다', val: 1 }
                    ].map((opt) => (
                      <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', color: '#cbd5e1' }}>
                        <input type="radio" name={`q${idx}`} value={opt.val} checked={q.state === opt.val} onChange={() => q.set(opt.val)} />
                        {opt.text}
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>설문5. 활동 중 가장 흥미로웠거나 새롭게 느껴졌던 부분은 무엇입니까?</p>
                <textarea className="glass-input" rows={3} value={q5} onChange={(e) => setQ5(e.target.value)} required style={{ color: '#fff', background: 'rgba(255,255,255,0.1)' }} />
              </div>
              <div>
                <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>설문6. 활동 내용이나 설명에서 아쉬웠던 점이나 개선하고 싶은 점이 있다면 자유롭게 적어주세요. (선택)</p>
                <textarea className="glass-input" rows={3} value={q6} onChange={(e) => setQ6(e.target.value)} style={{ color: '#fff', background: 'rgba(255,255,255,0.1)' }} />
              </div>

                <button onClick={submitSurvey} className="glass-button" style={{
                  background: '#3b82f6', color: '#fff', fontSize: '1.2rem', padding: '1rem', marginTop: '1rem', border: 'none'
                }}>
                  설문 제출하고 최종 보고서 보기
                </button>
              </div>
            </>
          )}
          </div>
        </div>
      )}

      {/* Final Report Modal */}
      {showReport && finalReportData && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.9)', zIndex: 110,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="glass-panel animate-fade-in" style={{
            background: '#fff', padding: '3rem', width: '90%', maxWidth: '800px',
            maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', color: '#000',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2.5rem', color: '#1e3a8a', margin: 0 }}>최종 평가 보고서</h2>
              <button 
                onClick={async () => {
                  try {
                    const html2pdf = (await import('html2pdf.js')).default;
                    const element = document.getElementById('final-report-content');
                    if (!element) return;
                    
                    const opt = {
                      margin: 0.5,
                      filename: `꿈통_보고서_${studentNumber}_${name}.pdf`,
                      image: { type: 'jpeg' as const, quality: 0.98 },
                      html2canvas: { scale: 2, useCORS: true },
                      jsPDF: { unit: 'in' as const, format: 'a4', orientation: 'portrait' as const }
                    };
                    
                    html2pdf().set(opt).from(element).save();
                  } catch (e) {
                    console.error('PDF 다운로드 실패:', e);
                    alert('PDF 다운로드 중 오류가 발생했습니다.');
                  }
                }}
                style={{ background: '#1e3a8a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                🖨️ PDF 다운로드
              </button>
            </div>
            
            <div id="final-report-content" style={{ 
              background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '2rem',
              whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '1.1rem'
            }}>
              {learningSummaryData && (
                <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '2px dashed #cbd5e1' }}>
                  <h3 style={{ color: '#1e3a8a', marginTop: 0 }}>📚 학습 정리</h3>
                  {learningSummaryData}
                </div>
              )}
              {finalReportData.replace(/# 최종 평가 보고서/, '').trim()}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center', color: '#64748b' }}>
              <p style={{ marginBottom: '1rem' }}>본 활동에 참여해 주셔서 감사합니다.</p>
              <button 
                onClick={() => {
                  const combinedName = studentNumber && name ? `${studentNumber} ${name}` : name || '익명';
                  window.location.href = `/share/${code}?name=${encodeURIComponent(combinedName)}`;
                }}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem' }}
              >
                🚀 결과 공유방 가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>로딩 중...</div>}>
      <ChatContent />
    </Suspense>
  );
}
