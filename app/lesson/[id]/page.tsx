'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchReportDetail(id);
    }
  }, [id]);

  const fetchReportDetail = async (reportId: string) => {
    setLoading(true);

    // 강습 리포트 데이터 가져오기
    const { data: report, error } = await supabase
      .from('lesson_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) {
      console.error('리포트 조회 에러:', error);
    } else {
      setReportData(report);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-stone-500 flex items-center justify-center text-xs font-medium">
        🛹 강습 피드백을 불러오는 중...
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-stone-800 flex flex-col items-center justify-center p-4">
        <p className="text-xs text-stone-500 mb-4">해당 강습 피드백을 찾을 수 없습니다.</p>
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2.5 bg-stone-900 text-white font-bold text-xs rounded-2xl"
        >
          메인으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 flex flex-col items-center p-4 sm:p-6 font-sans">
      <header className="w-full max-w-md my-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="text-xs font-bold text-stone-500 hover:text-stone-900"
        >
          ← 대시보드
        </button>
        <span className="text-xs font-bold tracking-wider text-stone-600 bg-stone-200/60 px-3 py-1 rounded-full">
          Lesson Report
        </span>
      </header>

      <main className="w-full max-w-md bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm space-y-6">
        {/* 상단 기본 헤더 */}
        <section className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <span className="text-[11px] text-stone-500 font-semibold block">
              🎓 {reportData.shop_name || '강습 리포트'}
            </span>
            <h1 className="text-xl font-extrabold text-stone-900 mt-0.5">
              {reportData.student_name ? `${reportData.student_name} 수강생` : '수강생 정보 없음'}
            </h1>
            <div className="text-xs text-stone-500 mt-1 flex flex-wrap items-center gap-1.5">
              {reportData.instructor_name && (
                <span>👨‍🏫 강사: <strong className="text-stone-800">{reportData.instructor_name}</strong></span>
              )}
              {reportData.spot_name && (
                <span>📍 파크: <strong className="text-stone-800">{reportData.spot_name}</strong></span>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 bg-stone-100 text-stone-800 border border-stone-200 text-[10px] font-bold rounded-full">
              {reportData.lesson_round || '1회차'}
            </span>
            <p className="text-[10px] text-stone-400 mt-1">
              {reportData.created_at ? new Date(reportData.created_at).toLocaleDateString() : ''}
            </p>
          </div>
        </section>

        {/* 📷 첨부 사진 */}
        {reportData.image_url ? (
          <section className="space-y-2">
            <span className="text-xs font-bold text-stone-600 block">📷 강습 / 자세 사진</span>
            <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 max-h-96 flex items-center justify-center">
              <a href={reportData.image_url} target="_blank" rel="noopener noreferrer" className="w-full">
                <img
                  src={reportData.image_url}
                  alt="강습 사진"
                  className="w-full h-auto max-h-96 object-contain hover:opacity-95 transition-opacity"
                />
              </a>
            </div>
            <p className="text-[10px] text-stone-400 text-center">
              * 이미지를 클릭하면 원본 크기로 볼 수 있습니다.
            </p>
          </section>
        ) : null}

        {/* 🏆 연습 / 달성한 기술 (트릭) */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
            🏆 오늘 연습 및 달성한 기술
          </h2>
          <div className="space-y-2">
            {reportData.mastered_tricks && reportData.mastered_tricks.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {reportData.mastered_tricks.map((trick: any, index: number) => {
                  const trickName = typeof trick === 'string' ? trick : trick.name;
                  const badge = typeof trick === 'object' ? trick.badge : null;
                  return (
                    <div
                      key={index}
                      className="p-2.5 px-3 bg-stone-50 border border-stone-200/70 rounded-2xl flex items-center gap-2"
                    >
                      <span className="font-bold text-xs text-stone-900">{trickName}</span>
                      {badge && (
                        <span className="text-[10px] bg-stone-900 text-white px-2 py-0.5 rounded-full font-medium">
                          {badge}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-stone-400 bg-stone-50 p-3 rounded-2xl">등록된 기술 정보가 없습니다.</p>
            )}
          </div>
        </section>

        {/* 💬 코치 피드백 노트 */}
        {reportData.instructor_note && (
          <section className="bg-stone-50 border border-stone-200/70 rounded-2xl p-4 space-y-1">
            <h3 className="text-[10px] font-bold text-stone-400 tracking-wider">COACH FEEDBACK</h3>
            <p className="text-xs text-stone-800 leading-relaxed font-medium whitespace-pre-wrap">
              "{reportData.instructor_note}"
            </p>
          </section>
        )}

        {/* 🎯 다음 목표 */}
        {reportData.next_goal && (
          <section className="bg-stone-100/70 border border-stone-200/60 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="text-base">🎯</div>
            <div>
              <span className="text-[10px] text-stone-400 font-bold block">NEXT GOAL</span>
              <span className="text-xs font-bold text-stone-800">{reportData.next_goal}</span>
            </div>
          </section>
        )}

        {/* 하단 버튼 영역 */}
        <div className="pt-2 space-y-2">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `${reportData.student_name} 수강생 피드백 리포트`,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('리포트 링크가 복사되었습니다!');
              }
            }}
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-2xl transition-all shadow-sm"
          >
            🔗 링크로 공유하기
          </button>

          <button
            onClick={async () => {
              if (!confirm('정말로 이 강습 리포트를 삭제하시겠습니까?')) return;
              const { error } = await supabase.from('lesson_reports').delete().eq('id', reportData.id);
              if (error) {
                alert('삭제 실패: ' + error.message);
              } else {
                alert('삭제되었습니다.');
                router.push('/');
              }
            }}
            className="w-full py-2.5 bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-500 font-bold text-xs rounded-2xl transition-all"
          >
            🗑️ 리포트 삭제하기
          </button>
        </div>
      </main>
    </div>
  );
}
