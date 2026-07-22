'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'logs' | 'lessons'>('logs');
  const [logs, setLogs] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // 달력 관련 상태
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const { data: profData } = await supabase.from('profiles').select('*').order('name');
    if (profData) setProfiles(profData);

    // 최근 등록순 내림차순 정렬
    const { data: logsData } = await supabase
      .from('skating_logs')
      .select('*')
      .order('session_date', { ascending: false })
      .order('id', { ascending: false });

    const { data: lessonsData } = await supabase
      .from('lesson_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (logsData) setLogs(logsData);
    if (lessonsData) setLessons(lessonsData);
    setLoading(false);
  };

  const handleDeleteLog = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('이 세션 일지를 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('skating_logs').delete().eq('id', id);
    if (error) {
      alert('삭제 중 오류 발생: ' + error.message);
    } else {
      alert('일지가 삭제되었습니다.');
      setLogs(logs.filter((item) => item.id !== id));
    }
  };

  const handleDeleteLesson = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('이 강습 피드백 리포트를 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('lesson_reports').delete().eq('id', id);
    if (error) {
      alert('삭제 중 오류 발생: ' + error.message);
    } else {
      alert('강습 리포트가 삭제되었습니다.');
      setLessons(lessons.filter((item) => item.id !== id));
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const formatDateStr = (dayNum: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const hasLogOnDate = (dateStr: string) => logs.some((l) => l.session_date === dateStr);
  const hasLessonOnDate = (dateStr: string) =>
    lessons.some((l) => l.created_at && l.created_at.startsWith(dateStr));

  const filteredLogs = logs.filter((item) => {
    const matchUser = selectedProfile === 'ALL' || item.user_name === selectedProfile;
    const matchDate = selectedDateStr ? item.session_date === selectedDateStr : true;
    return matchUser && matchDate;
  });

  const filteredLessons = lessons.filter((item) => {
    const matchUser = selectedProfile === 'ALL' || item.student_name === selectedProfile;
    const matchDate = selectedDateStr
      ? item.created_at && item.created_at.startsWith(selectedDateStr)
      : true;
    return matchUser && matchDate;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 flex flex-col items-center p-4 sm:p-6 font-sans">
      <main className="w-full max-w-md space-y-5">
        {/* 스케이터 필터 */}
        <section className="bg-white border border-stone-200/80 rounded-3xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-stone-900">👤 스케이터 선택</span>
            {selectedProfile !== 'ALL' && (
              <button
                onClick={() => setSelectedProfile('ALL')}
                className="text-[10px] text-stone-400 hover:text-stone-700 underline font-medium"
              >
                전체보기
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedProfile('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedProfile === 'ALL'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
              }`}
            >
              전체
            </button>
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProfile(p.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedProfile === p.name
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </section>

        {/* 작성하기 버튼 */}
        <div className="grid grid-cols-2 gap-2.5">
          <a
            href="/log"
            className="bg-stone-900 hover:bg-stone-800 text-white p-3.5 rounded-2xl text-center shadow-sm transition-all active:scale-[0.98]"
          >
            <div className="text-xs font-bold">+ 일지 작성하기</div>
            <div className="text-[10px] text-stone-400 mt-0.5">개인 세션 기록</div>
          </a>
          <a
            href="/write"
            className="bg-stone-200/70 hover:bg-stone-200 text-stone-900 p-3.5 rounded-2xl text-center transition-all active:scale-[0.98]"
          >
            <div className="text-xs font-bold">+ 강습 작성하기</div>
            <div className="text-[10px] text-stone-500 mt-0.5">강사 코칭 기록</div>
          </a>
        </div>

        {/* 달력 */}
        <section className="bg-white border border-stone-200/80 rounded-3xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between px-1">
            <button onClick={prevMonth} className="text-xs font-bold text-stone-400 hover:text-stone-900 px-2 py-1">
              &lt;
            </button>
            <h2 className="text-xs font-extrabold text-stone-900">
              {year}년 {month + 1}월
            </h2>
            <button onClick={nextMonth} className="text-xs font-bold text-stone-400 hover:text-stone-900 px-2 py-1">
              &gt;
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-stone-400">
            <span className="text-red-400">일</span>
            <span>월</span>
            <span>화</span>
            <span>수</span>
            <span>목</span>
            <span>금</span>
            <span>토</span>
          </div>

          <div className="grid grid-cols-7 text-center gap-y-1 text-xs">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = formatDateStr(dayNum);
              const isSelected = selectedDateStr === dateStr;
              const isLogExist = hasLogOnDate(dateStr);
              const isLessonExist = hasLessonOnDate(dateStr);

              return (
                <button
                  key={dayNum}
                  onClick={() => {
                    if (selectedDateStr === dateStr) {
                      setSelectedDateStr(null);
                    } else {
                      setSelectedDateStr(dateStr);
                    }
                  }}
                  className={`py-1.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-stone-900 text-white font-bold'
                      : 'hover:bg-stone-100 text-stone-800'
                  }`}
                >
                  <span>{dayNum}</span>
                  <div className="flex gap-0.5 mt-0.5">
                    {isLogExist && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-stone-900'}`} />}
                    {isLessonExist && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-600'}`} />}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedDateStr && (
            <div className="text-center pt-1 border-t border-stone-100">
              <button
                onClick={() => setSelectedDateStr(null)}
                className="text-[10px] text-stone-400 hover:text-stone-800 underline"
              >
                선택된 날짜 필터 해제 ({selectedDateStr})
              </button>
            </div>
          )}
        </section>

        {/* 탭 */}
        <div className="flex bg-stone-200/50 p-1 rounded-2xl border border-stone-200/60">
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'logs'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            🛹 개인 일지 ({filteredLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'lessons'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            🎓 강습 피드백 ({filteredLessons.length})
          </button>
        </div>

        {/* 목록 */}
        {loading ? (
          <div className="py-12 text-center text-xs text-stone-400">데이터를 가져오는 중...</div>
        ) : (
          <div className="space-y-3">
            {activeTab === 'logs' && (
              filteredLogs.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-stone-200/70 text-xs text-stone-400">
                  해당하는 세션 기록이 없습니다.
                </div>
              ) : (
                filteredLogs.map((item) => (
                  <a
                    key={item.id}
                    href={`/log/${item.id}`}
                    className="block bg-white border border-stone-200/80 hover:border-stone-400 rounded-3xl p-5 shadow-sm space-y-3 transition-all relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-stone-900">📍 {item.spot_name}</span>
                        <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-bold">
                          {item.user_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-stone-400">{item.session_date}</span>
                        <button
                          onClick={(e) => handleDeleteLog(item.id, e)}
                          className="text-stone-300 hover:text-red-500 text-xs p-1 transition-colors z-10"
                          title="삭제하기"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {item.image_url && (
                      <div className="rounded-2xl overflow-hidden border border-stone-200/60 max-h-52 bg-stone-50 flex items-center justify-center">
                        <img src={item.image_url} alt="세션 사진" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {item.practiced_tricks?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.practiced_tricks.map((trick: string, idx: number) => (
                          <span key={idx} className="bg-stone-100 text-stone-700 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-stone-200/60">
                            {trick}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.memo && (
                      <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-2xl border border-stone-100 leading-relaxed line-clamp-2">
                        "{item.memo}"
                      </p>
                    )}
                  </a>
                ))
              )
            )}

            {activeTab === 'lessons' && (
              filteredLessons.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-stone-200/70 text-xs text-stone-400">
                  해당하는 강습 피드백이 없습니다.
                </div>
              ) : (
                filteredLessons.map((item) => (
                  <a
                    key={item.id}
                    href={`/lesson/${item.id}`}
                    className="block bg-white border border-stone-200/80 hover:border-stone-400 rounded-3xl p-5 shadow-sm space-y-3 transition-all relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-stone-900">🎓 {item.shop_name || '강습 리포트'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-stone-100 text-stone-600 font-bold px-2 py-0.5 rounded-full">
                          {item.student_name} 수강생
                        </span>
                        <button
                          onClick={(e) => handleDeleteLesson(item.id, e)}
                          className="text-stone-300 hover:text-red-500 text-xs p-1 transition-colors z-10"
                          title="삭제하기"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-stone-500 flex flex-wrap gap-2">
                      {item.instructor_name && <span>강사: <strong className="text-stone-800">{item.instructor_name}</strong></span>}
                      {item.spot_name && <span>📍 <strong className="text-stone-800">{item.spot_name}</strong></span>}
                    </div>

                    {item.image_url && (
                      <div className="rounded-2xl overflow-hidden border border-stone-200/60 max-h-52 bg-stone-50 flex items-center justify-center">
                        <img src={item.image_url} alt="강습 사진" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {item.mastered_tricks && item.mastered_tricks.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.mastered_tricks.map((trickObj: any, idx: number) => (
                          <span key={idx} className="bg-stone-100 text-stone-700 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-stone-200/60 flex items-center gap-1">
                            <span>{typeof trickObj === 'string' ? trickObj : trickObj.name}</span>
                            {trickObj.badge && (
                              <span className="text-[9px] bg-stone-200 text-stone-600 px-1 py-0.2 rounded font-bold">
                                {trickObj.badge}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.instructor_note && (
                      <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 space-y-1">
                        <span className="text-[10px] font-bold text-stone-400 block">COACH FEEDBACK</span>
                        <p className="text-xs text-stone-700 leading-relaxed line-clamp-2">{item.instructor_note}</p>
                      </div>
                    )}
                  </a>
                ))
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}
