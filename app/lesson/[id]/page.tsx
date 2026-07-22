'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params?.id as string;

  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (lessonId) {
      fetchLessonDetail();
    }
  }, [lessonId]);

  const fetchLessonDetail = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('lesson_reports')
      .select(`
        *,
        spots ( name ),
        lesson_tricks (
          badge,
          tricks ( id, name, difficulty )
        )
      `)
      .eq('id', lessonId)
      .maybeSingle();

    if (error) {
      console.error('강습 상세 조회 에러:', error);
    } else {
      setLesson(data);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 강습 리포트를 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('lesson_reports').delete().eq('id', lessonId);
    if (error) {
      alert('삭제 중 오류가 발생했습니다: ' + error.message);
    } else {
      alert('강습 리포트가 삭제되었습니다.');
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-stone-400 text-xs font-semibold">
        🎓 강습 정보를 불러오는 중...
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4">
        <p className="text-xs text-stone-500 mb-4">해당 강습 피드백을 찾을 수 없습니다.</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold"
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
          ← 목록으로
        </button>
        <span className="text-xs font-bold tracking-wider text-stone-600 bg-stone-200/60 px-3 py-1 rounded-full">
          Lesson Report Detail
        </span>
      </header>

      <main className="w-full max-w-md bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm space-y-6">
        {/* 헤더 정보 */}
        <div className="border-b border-stone-100 pb-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold text-stone-900">
              🎓 {lesson.shop_name || '강습 리포트'}
            </span>
            <span className="text-[10px] bg-stone-900 text-white px-2.5 py-0.5 rounded-full font-bold">
              {lesson.lesson_round || '1회차'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 pt-1">
            <span>수강생: <strong className="text-stone-900">{lesson.student_name}</strong></span>
            <span>•</span>
            <span>담당 강사: <strong className="text-stone-900">{lesson.instructor_name || '미지정'}</strong></span>
          </div>

          <div className="text-xs text-stone-500 pt-1">
            📍 연습 장소: <strong className="text-stone-800">{lesson.spots?.name || '장소 정보 없음'}</strong>
          </div>
        </div>

        {/* 사진 */}
        {lesson.image_url && (
          <div className="rounded-2xl overflow-hidden border border-stone-200/80 bg-stone-50 flex items-center justify-center">
            <img src={lesson.image_url} alt="강습 사진" className="w-full h-auto object-cover max-h-80" />
          </div>
        )}

        {/* 연습 및 달성한 트릭 */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold text-stone-900">🏆 연습 및 달성한 트릭</h3>
          {lesson.lesson_tricks && lesson.lesson_tricks.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {lesson.lesson_tricks.map((lt: any, idx: number) => (
                <span
                  key={idx}
                  className="bg-stone-900 text-white text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5"
                >
                  <span>{lt.tricks?.name}</span>
                  {lt.badge && (
                    <span className="text-[10px] bg-amber-400 text-stone-900 px-1.5 py-0.2 rounded font-extrabold">
                      {lt.badge}
                    </span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 bg-stone-50 p-3 rounded-2xl border border-stone-100">
              등록된 트릭이 없습니다.
            </p>
          )}
        </div>

        {/* 코치 피드백 */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold text-stone-900">💬 코치 피드백</h3>
          <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-100 whitespace-pre-wrap">
            {lesson.instructor_note || '작성된 피드백이 없습니다.'}
          </p>
        </div>

        {/* 다음 목표 */}
        {lesson.next_goal && (
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold text-stone-900">🎯 다음 목표</h3>
            <p className="text-xs font-bold text-emerald-800 bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-100">
              {lesson.next_goal}
            </p>
          </div>
        )}

        {/* 인스타 영상 */}
        {lesson.instagram_url && (
          <div className="pt-2">
            <a
              href={lesson.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 text-xs font-bold text-pink-600 bg-pink-50 hover:bg-pink-100 py-3 rounded-2xl border border-pink-100 transition-all"
            >
              📸 인스타그램 영상 확인하기 ↗
            </a>
          </div>
        )}

        {/* 삭제 버튼 */}
        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            onClick={handleDelete}
            className="text-xs font-bold text-stone-400 hover:text-red-500 transition-colors"
          >
            🗑 리포트 삭제하기
          </button>
        </div>
      </main>
    </div>
  );
}
