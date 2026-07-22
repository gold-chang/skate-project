'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function FeedbackReportPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Supabase DB에서 가장 최근 작성된 리포트 1건 가져오기
  useEffect(() => {
    async function fetchLatestReport() {
      const { data, error } = await supabase
        .from('lesson_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('데이터 불러오기 에러:', error);
      } else if (data && data.length > 0) {
        setReportData(data[0]);
      }
      setLoading(false);
    }

    fetchLatestReport();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-amber-400 font-bold animate-pulse">🛹 Supabase DB에서 최신 리포트를 불러오는 중...</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <p className="text-slate-400 mb-4">아직 작성된 강습 리포트가 없습니다.</p>
        <a
          href="/write"
          className="px-6 py-3 bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg"
        >
          첫 리포트 작성하러 가기
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 sm:p-6">
      {/* 헤더 */}
      <header className="w-full max-w-md my-4 text-center">
        <span className="text-xs font-semibold tracking-wider text-amber-400 uppercase bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
          Lesson Report
        </span>
        <h1 className="text-2xl font-black mt-2 text-white tracking-tight">
          🛹 강습 피드백 리포트
        </h1>
      </header>

      {/* 리포트 카드 메인 */}
      <main className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* 1. 기본 정보 */}
        <section className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs text-amber-400 font-semibold">{reportData.shop_name}</span>
            <h2 className="text-xl font-bold text-white">{reportData.student_name} 수강생</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              담당: {reportData.instructor_name} | {reportData.spot_name}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-lg">
              출석 완료
            </span>
            <p className="text-xs text-slate-400 mt-1">{reportData.lesson_round}</p>
          </div>
        </section>

        {/* 2. 오늘 성공한 트릭 */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
            🏆 오늘 달성한 트릭 (Level Up)
          </h3>
          <div className="space-y-2">
            {reportData.mastered_tricks && reportData.mastered_tricks.length > 0 ? (
              reportData.mastered_tricks.map((trick: any, index: number) => (
                <div
                  key={index}
                  className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl flex items-start justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{trick.name}</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                        {trick.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{trick.desc}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">오늘 선택한 트릭이 없습니다.</p>
            )}
          </div>
        </section>

        {/* 3. 강사 피드백 */}
        {reportData.instructor_note && (
          <section className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1">
              💬 강사님 피드백
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed font-normal">
              "{reportData.instructor_note}"
            </p>
          </section>
        )}

        {/* 4. 다음 목표 */}
        {reportData.next_goal && (
          <section className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-3 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl text-lg">🎯</div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">NEXT GOAL</span>
              <span className="text-xs font-bold text-slate-200">{reportData.next_goal}</span>
            </div>
          </section>
        )}

        {/* 작성 페이지 이동 / 공유 버튼 */}
        <div className="pt-2 space-y-2">
          <a
            href="/write"
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-400/10 transition-all flex items-center justify-center gap-2 block text-center"
          >
            ✏️ 새 강습 피드백 작성하기
          </a>
        </div>
      </main>

      <footer className="mt-6 text-center text-xs text-slate-500">
        등록일: {new Date(reportData.created_at).toLocaleDateString()} | Skateboard Log App MVP
      </footer>
    </div>
  );
}
