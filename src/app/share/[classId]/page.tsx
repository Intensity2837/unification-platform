'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

function QuizChallengeModal({ quizzes, onClose, studentName }: { quizzes: any[], onClose: () => void, studentName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<{isCorrect: boolean, msg: string} | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const currentQuiz = quizzes[currentIndex];

  const handleCheckInput = () => {
    if (!userAnswer.trim()) {
      alert('정답을 입력해주세요!');
      return;
    }
    const correctAns = currentQuiz.answer;
    const isCorrect = userAnswer.includes(correctAns) || correctAns.includes(userAnswer);
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setFeedback({ isCorrect: true, msg: '정답입니다! 🎉' });
    } else {
      setFeedback({ isCorrect: false, msg: `아쉽습니다! 틀렸어요.` });
    }
    setIsRevealed(true);
  };

  const handleCheckOption = (opt: string) => {
    setUserAnswer(opt);
    const correctAns = currentQuiz.answer;
    const isCorrect = opt === correctAns || opt.includes(correctAns) || correctAns.includes(opt);
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setFeedback({ isCorrect: true, msg: '정답입니다! 🎉' });
    } else {
      setFeedback({ isCorrect: false, msg: `아쉽습니다! 틀렸어요.` });
    }
    setIsRevealed(true);
  };

  const handleNext = () => {
    setUserAnswer('');
    setIsRevealed(false);
    setFeedback(null);
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowSummary(true);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#1e293b', width: '90%', maxWidth: '600px',
        borderRadius: '16px', padding: '2.5rem', color: '#fff',
        border: '2px solid rgba(255,255,255,0.1)',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
        >
          ✖
        </button>

        {showSummary ? (
          <div style={{ animation: 'fadeIn 0.5s ease-out', padding: '2rem 0' }}>
            <h2 style={{ color: '#fbbf24', marginBottom: '1.5rem', textAlign: 'center', fontSize: '2.5rem' }}>
              🎉 퀴즈 도전 완료!
            </h2>
            <p style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
              총 {quizzes.length}문제 중 <span style={{ color: '#10b981', fontWeight: 'bold' }}>{correctCount}문제</span>를 맞췄습니다!
            </p>
            <p style={{ textAlign: 'center', fontSize: '1.2rem', marginBottom: '2.5rem', color: '#cbd5e1' }}>
              {correctCount === quizzes.length ? '완벽해요! 북한 마스터가 되셨군요! 🏆' : 
               correctCount >= Math.ceil(quizzes.length / 2) ? '잘 하셨어요! 대단한 실력이네요! 👍' : 
               '조금 아쉽지만 훌륭한 도전이었어요! 화이팅! 💪'}
            </p>
            <button 
              onClick={onClose}
              style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '1.2rem', width: '100%', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
            >
              결과 공유방으로 돌아가기
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ color: '#fbbf24', marginBottom: '0.5rem', textAlign: 'center' }}>
              🎯 {studentName} 학생의 퀴즈 도전!
            </h2>
            <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '2rem' }}>
              문제 {currentIndex + 1} / {quizzes.length}
            </p>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
              <p style={{ fontSize: '1.2rem', lineHeight: 1.6, fontWeight: 'bold' }}>
                Q. {currentQuiz.question}
              </p>
            </div>

        {!isRevealed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentQuiz.options && currentQuiz.options.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {currentQuiz.options.map((opt: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleCheckOption(opt)}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      padding: '1rem',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <input 
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  placeholder="나의 정답을 입력하세요..."
                  style={{ padding: '1.2rem', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: '1.1rem', outline: 'none' }}
                  onKeyDown={e => e.key === 'Enter' && handleCheckInput()}
                  autoFocus
                />
                <button 
                  onClick={handleCheckInput}
                  style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
                >
                  정답 확인하기
                </button>
              </>
            )}
          </div>
        ) : (
          <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {feedback && (
              <div style={{
                background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.5rem',
                border: `2px solid ${feedback.isCorrect ? '#10b981' : '#ef4444'}`,
                marginBottom: '1.5rem',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: feedback.isCorrect ? '#34d399' : '#f87171',
                textAlign: 'center', lineHeight: 1.5 
              }}>
                {feedback.msg}
              </div>
            )}
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <p style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.8rem' }}>
                실제 정답: {currentQuiz.answer}
              </p>
              <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>
                해설: {currentQuiz.explanation}
              </p>
            </div>
            
            <button 
              onClick={handleNext}
              style={{ background: '#10b981', color: '#fff', border: 'none', padding: '1.2rem', width: '100%', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
            >
              {currentIndex < quizzes.length - 1 ? '다음 문제로 ➔' : '퀴즈 완료하기 🌟'}
            </button>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}

function ShareBoardContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const classId = params.classId as string;
  const urlName = searchParams.get('name');
  const [currentUserName, setCurrentUserName] = useState(urlName || '');

  useEffect(() => {
    if (!currentUserName) {
      const storedName = localStorage.getItem('studentName');
      const storedNumber = localStorage.getItem('studentNumber');
      if (storedName) {
        setCurrentUserName(storedNumber ? `${storedNumber} ${storedName}` : storedName);
      }
    }
  }, [currentUserName]);

  const [sessions, setSessions] = useState<any[]>([]);
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [activeQuizSet, setActiveQuizSet] = useState<any[] | null>(null);

  useEffect(() => {
    if (!classId) return;
    fetch(`/api/share/${classId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSessions(data.sessions);
          setClassName(data.className);
        } else {
          alert(data.error || '데이터를 불러오는 데 실패했습니다.');
        }
      })
      .catch(err => {
        console.error(err);
        alert('네트워크 오류가 발생했습니다.');
      })
      .finally(() => setLoading(false));
  }, [classId]);

  const closeDialog = () => {
    setSelectedSession(null);
    setCommentInput('');
  };

  const toggleLike = async () => {
    if (!selectedSession) return;
    try {
      const res = await fetch(`/api/share/${classId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSession.id, likerName: currentUserName })
      });
      const data = await res.json();
      if (data.success) {
        const updateLikes = (likes: any[] = []) => {
          return data.action === 'added'
            ? [...likes, { id: Date.now().toString(), likerName: currentUserName }]
            : likes.filter(l => l.likerName !== currentUserName);
        };
        
        setSessions(prev => prev.map(s => s.id === selectedSession.id ? { ...s, likes: updateLikes(s.likes) } : s));
        setSelectedSession((prev: any) => ({ ...prev, likes: updateLikes(prev.likes) }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addComment = async () => {
    if (!selectedSession || !commentInput.trim()) return;
    try {
      const res = await fetch(`/api/share/${classId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSession.id, authorName: currentUserName, content: commentInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setCommentInput('');
        setSessions(prev => prev.map(s => s.id === selectedSession.id ? { ...s, comments: [...(s.comments || []), data.comment] } : s));
        setSelectedSession((prev: any) => ({ ...prev, comments: [...(prev.comments || []), data.comment] }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: '#fff' }}>로딩 중...</div>;
  }

  if (!currentUserName) {
    return (
      <div style={{ minHeight: '100vh', padding: '2rem', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#1e293b', padding: '3rem', borderRadius: '16px', border: '1px solid #334155', textAlign: 'center' }}>
          <h2 style={{ color: '#60a5fa', marginBottom: '1rem' }}>공유방 입장</h2>
          <p style={{ color: '#cbd5e1', marginBottom: '2rem' }}>피드백을 남길 때 사용할 이름을 입력해주세요.</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const name = fd.get('name') as string;
            const number = fd.get('number') as string;
            if (name.trim()) {
              const combined = number.trim() ? `${number.trim()} ${name.trim()}` : name.trim();
              setCurrentUserName(combined);
              localStorage.setItem('studentName', name.trim());
              if (number.trim()) localStorage.setItem('studentNumber', number.trim());
            }
          }}>
            <input 
              name="number"
              placeholder="예: 10101 (선택사항 - 학번)" 
              style={{ padding: '1rem', width: '100%', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff', marginBottom: '1rem', fontSize: '1.1rem' }}
            />
            <input 
              name="name"
              placeholder="예: 홍길동, 1학년 1반 쌤" 
              required
              style={{ padding: '1rem', width: '100%', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff', marginBottom: '1rem', fontSize: '1.1rem' }}
            />
            <button type="submit" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '1rem', width: '100%', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>
              입장하기
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', background: '#0f172a' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#60a5fa', fontSize: '2.5rem' }}>📢 {className} 결과 공유방</h1>
        <p style={{ color: '#cbd5e1' }}>접속자: <span style={{color: '#fff', fontWeight: 'bold'}}>{currentUserName}</span> | 친구들이 어떻게 북한 대표와 협상했는지 확인하고 피드백을 남겨주세요!</p>
      </header>

      {activeQuizSet && selectedSession && (
        <QuizChallengeModal 
          quizzes={activeQuizSet} 
          onClose={() => setActiveQuizSet(null)} 
          studentName={selectedSession.name}
        />
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '2rem',
        padding: '1rem'
      }}>
        {sessions.map(session => {
          let aiSummary = '진행 중인 대화입니다...';
          if (session.evaluation?.aiSummary) {
            aiSummary = session.evaluation.aiSummary;
          } else if (session.messages) {
            const stage5Msg = session.messages.find((m: any) => m.content.includes('[STAGE: 5]'));
            if (stage5Msg) {
              const match = stage5Msg.content.match(/1\.\s*대화\s*요약\n([\s\S]*?)2\./);
              if (match && match[1]) {
                aiSummary = match[1].trim();
              } else {
                aiSummary = '협상을 마쳤습니다!';
              }
            }
          }

          return (
            <div 
              key={session.id} 
              onClick={() => setSelectedSession(session)}
              style={{
                background: '#fef3c7',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                color: '#1e3a8a',
                transition: 'transform 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <h3 style={{ borderBottom: '2px dashed #fbbf24', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                {session.studentNumber} {session.name}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#475569', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {aiSummary}
              </p>
              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#b45309', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                <span>클릭하여 대화 보기 🔍</span>
                <span style={{ fontSize: '1rem' }}>❤️ {session.likes?.length || 0}  💬 {session.comments?.length || 0}</span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedSession && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#1e293b', width: '90%', maxWidth: '800px', height: '85vh',
            borderRadius: '16px', display: 'flex', flexDirection: 'column', color: '#fff',
            border: '2px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>{selectedSession.name} 학생의 대화 기록</h2>
              <button 
                onClick={closeDialog}
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                닫기
              </button>
            </div>

            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(() => {
                let currentStage = 1;
                return selectedSession.messages.map((m: any, i: number) => {
                  const isUser = m.role === 'USER';
                
                // Extract Stage Information
                let stageMatch = m.content.match(/\[STAGE:\s*(\d+)\]/);
                let stageLabel = '';
                if (stageMatch) {
                  currentStage = parseInt(stageMatch[1], 10);
                }
                stageLabel = `[${currentStage}단계]`;
                let aiName = currentStage === 3 ? '북한 대표' : '꿈통이';

                // Check for Quiz Data (entire array)
                let messageQuizArray = null;
                const quizMatch = m.content.match(/\[QUIZ_DATA\]([\s\S]*?)\[\/QUIZ_DATA\]/);
                if (quizMatch) {
                  try {
                    const parsed = JSON.parse(quizMatch[1]);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      messageQuizArray = parsed; 
                    }
                  } catch(e) {}
                }

                // Clean up tags
                let cleanContent = m.content
                  .replace(/\*\*/g, '')
                  .replace(/\[STAGE:\s*\d+\]/g, '')
                  .replace(/\[EMOTION:\s*[A-Z]+\]/gi, '')
                  .replace(/\[HINT_START\][\s\S]*?\[HINT_END\]/g, '') 
                  .replace(/\[HINT_TITLE:[^\]]*\]/g, '')
                  .replace(/\[QUIZ_DATA\][\s\S]*?\[\/QUIZ_DATA\]/g, '') 
                  .replace(/\[END_ROLEPLAY\]/g, '') // Remove END_ROLEPLAY tag
                  .trim();
                
                if (!cleanContent && !messageQuizArray) return null;

                return (
                  <div key={i} style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    background: isUser ? '#3b82f6' : '#334155',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    maxWidth: '80%',
                    lineHeight: 1.5
                  }}>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '4px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {stageLabel && <span style={{ background: '#f59e0b', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{stageLabel}</span>}
                      <span>{isUser ? selectedSession.name : aiName}</span>
                    </div>
                    {cleanContent && <div style={{ whiteSpace: 'pre-wrap' }}>{cleanContent}</div>}
                    
                    {messageQuizArray && (
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem', textAlign: 'center' }}>
                        <h3 style={{ color: '#fbbf24', marginBottom: '0.5rem', fontSize: '1.2rem' }}>🎉 4단계 퀴즈 출제 완료!</h3>
                        <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', fontSize: '0.9rem' }}>이 학생이 풀었던 {messageQuizArray.length}문제를 똑같이 풀어보세요.</p>
                        <button 
                          onClick={() => setActiveQuizSet(messageQuizArray)}
                          style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', width: '100%' }}
                        >
                          🎯 {selectedSession.name} 학생의 퀴즈 도전!
                        </button>
                      </div>
                    )}
                  </div>
                );
              })})()}
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={toggleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', padding: 0 }}>
                  {selectedSession.likes?.some((l: any) => l.likerName === currentUserName) ? '❤️' : '🤍'} 
                  <span style={{ fontSize: '1.2rem' }}>{selectedSession.likes?.length || 0}</span>
                </button>
                <h3 style={{ margin: 0, color: '#94a3b8', fontSize: '1.1rem' }}>댓글 {selectedSession.comments?.length || 0}개</h3>
              </div>
              
              <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedSession.comments?.map((c: any) => (
                  <div key={c.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.95rem' }}>
                    <span style={{ fontWeight: 'bold', color: '#60a5fa', marginRight: '0.8rem' }}>{c.authorName}</span>
                    <span style={{ color: '#e2e8f0' }}>{c.content}</span>
                  </div>
                ))}
                {(!selectedSession.comments || selectedSession.comments.length === 0) && (
                  <div style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>첫 번째 댓글을 남겨주세요!</div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  placeholder="친구의 협상 결과에 따뜻한 피드백을 남겨주세요..."
                  style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #475569', background: '#1e293b', color: '#fff', outline: 'none' }}
                  onKeyDown={e => e.key === 'Enter' && addComment()}
                />
                <button onClick={addComment} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  등록
                </button>
              </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShareBoardPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', color: '#fff' }}>로딩 중...</div>}>
      <ShareBoardContent />
    </Suspense>
  );
}
