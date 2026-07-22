'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function WriteReportPage() {
  const [loading, setLoading] = useState(false);

  // 폼 입력 데이터 상태 관리
  const [formData, setFormData] = useState({
    shopName: '홍대 로컬 스케이트샵',
    studentName: '',
    instructorName: '',
    spotName: '뚝섬 스케이트파크',
    lessonRound: '1회차 / 10회',
    instructorNote: '',
    nextGoal: '',
  });

  // 선택된 트릭 뱃지 관리
  const [selectedTricks, setSelectedTricks] = useState<string[]>([]);

  const availableTricks = [
    'Ollie (알리)',
    'FS 180',
    'BS 180',
    'Kickflip (킥플립)',
    'Heelflip (힐플립)',
    'Shuvit (샤빗)',
  ];

  // 트릭 원터치 토글 함수
  const toggleTrick = (trick: string) => {
    if (selectedTricks.includes(trick)) {
      setSelectedTricks(selectedTricks.filter((t) => t !== trick));
    } else {
      setSelectedTricks([...selectedTricks, trick]);
    }
  };

  // Supabase DB에 리포트 저장 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.instructorName) {
      alert('수강생 이름과 강사 이름을 입력해주세요!');
      return;
    }

    setLoading(true);

    // DB 저장을 위한 포맷팅
    const masteredTricksFormatted = selectedTricks.map((trick) => ({
      name: trick,
      badge: '🔥 성공',
      desc: '오늘 강습 중 달성 완료!',
    }));

    // Supabase lesson_reports 테이블에 INSERT
    const { data, error } = await supabase.from('lesson_reports').insert([
      {
        student_name: formData.studentName,
        instructor_name: formData.instructorName,
        shop_name: formData.shopName,
        spot_name: formData.spotName,
        lesson_round: formData.lessonRound,
        mastered_tricks: masteredTricksFormatted,
        instructor_note: formData.instructorNote,
        next_goal: formData.nextGoal,
      },
    ]);

    setLoading(false);

    if (error) {
      console.error('DB 저장 에러:', error);
      alert('저장 중 오류가 발생했습니다: ' + error.message);
    } else {
      alert('🎉 강습 리포트가 성공적으로 Supabase DB에 저장되었습니다!');
      // 저장 성공 후 메인 페이지로 이동
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 sm:p-6">
      <header className="w-full max-w-md my-4">
        <h1 className="text-2xl font-black text-white">🛹 강사용 피드백 작성</h1>
        <p className="text-xs text-slate-400 mt-1">
          터치 몇 번으로 10초 만에 리포트를 작성해보세요.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
      >
        {/* 수강생 & 강사 이름 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1">
              수강생 이름 *
            </label>
            <input
              type="text"
              placeholder="예: 김철수"
              value={formData.studentName}
              onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1">
              담당 강사 이름 *
            </label>
            <input
              type="text"
              placeholder="예: 이로컬"
              value={formData.instructorName}
              onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* 샵 & 스팟 정보 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1">소속 보드샵</label>
            <input
              type="text"
              value={formData.shopName}
              onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1">회차</label>
            <input
              type="text"
              value={formData.lessonRound}
              onChange={(e) => setFormData({ ...formData, lessonRound: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* 원터치 스킬(트릭) 뱃지 선택 */}
        <div>
          <label className="text-xs text-slate-400 font-semibold block mb-2">
            🏆 오늘 성공한 트릭 (터치하여 선택)
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTricks.map((trick) => {
              const isSelected = selectedTricks.includes(trick);
              return (
                <button
                  type="button"
                  key={trick}
                  onClick={() => toggleTrick(trick)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {isSelected ? `✓ ${trick}` : `+ ${trick}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* 강사 한줄 코멘트 */}
        <div>
          <label className="text-xs text-slate-400 font-semibold block mb-1">
            💬 강사 피드백 코멘트
          </label>
          <textarea
            rows={3}
            placeholder="오늘 아이의 폼이나 칭찬할 점을 적어주세요."
            value={formData.instructorNote}
            onChange={(e) => setFormData({ ...formData, instructorNote: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>

        {/* 다음 목표 */}
        <div>
          <label className="text-xs text-slate-400 font-semibold block mb-1">🎯 다음 수업 목표</label>
          <input
            type="text"
            placeholder="예: Kickflip 회전 감각 익히기"
            value={formData.nextGoal}
            onChange={(e) => setFormData({ ...formData, nextGoal: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* 저장 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-400/10 transition-all"
        >
          {loading ? 'Supabase DB에 저장 중...' : '🚀 강습 리포트 저장하기'}
        </button>
      </form>
    </div>
  );
}
