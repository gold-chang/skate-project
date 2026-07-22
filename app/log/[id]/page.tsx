'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const logId = params.id as string;

  const [log, setLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (logId) fetchLogDetail();
  }, [logId]);

  const fetchLogDetail = async () => {
    setLoading(true);

    // spots 및 log_tricks (tricks) 조인 쿼리
    const { data, error } = await supabase
      .from('skating_logs')
      .select(`
        *,
        spots ( name ),
        log_tricks (
          tricks ( id, name, category )
        )
      `)
      .eq('id', logId)
      .single();

    if (error) {
      console.error('일지 상세 조회 오류:', error);
    } else {
      setLog(data);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 개인 일지를 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('skating_logs').delete().eq('id', logId);
    if (error) {
      alert('삭제 중 오류가 발생했습니다: ' + error.message);
    } else {
      alert('일지가 삭제되었습니다.');
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-stone-400 text-xs">
        상세 정보를 불러오는 중...
      </div>
    );
  }

  if (!log) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4">
        <p className="text-xs text-stone-500 mb-4">해당 일지를 찾을 수 없습니다.</p>
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
          Skate Log Detail
        </span>
      </header>

      <main className="w-full max-w-md bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm space-y-6">
        {/* 헤더 정보 */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-4">
          <div>
            <span className="inline-block text-[10px] font-extrabold bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full mb-1">
              👤 {log.user_name}
            </span>
            <h1 className="text-base font-extrabold text-stone-900">
              📍 {log.spots?.name || '장소 정보 없음'}
            </h1>
          </div>
          <span className="text-xs font-semibold text-stone-400">{log.session_date}</span>
        </div>

        {/* 사진 */}
        {log.image_url && (
          <div className="rounded-2xl overflow-hidden border border-stone-200/80 bg-stone-50 flex items-center justify-center">
            <img src={log.image_url} alt="세션 사진" className="w-full h-auto object-cover max-h-80" />
          </div>
        )}

        {/* 연습한 트릭 */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold text-stone-900">🔥 연습한 트릭</h3>
          {log.log_tricks && log.log_tricks.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {log.log_tricks.map((lt: any, idx: number) => (
                <span
                  key={idx}
                  className="bg-stone-900 text-white text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5"
                >
                  <span>{lt.tricks?.name}</span>
                  {lt.tricks?.category && (
                    <span className="text-[9px] bg-stone-700 text-stone-300 px-1.5 py-0.2 rounded">
                      {lt.tricks.category}
                    </span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 bg-stone-50 p-3 rounded-2xl border border-stone-100">
              기록된 트릭이 없습니다.
            </p>
          )}
        </div>

        {/* 메모 */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold text-stone-900">📝 메모</h3>
          <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-100 whitespace-pre-wrap">
            {log.memo || '작성된 메모가 없습니다.'}
          </p>
        </div>

        {/* 인스타 영상 */}
        {log.instagram_url && (
          <div className="pt-2">
            <a
              href={log.instagram_url}
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
            🗑 일지 삭제하기
          </button>
        </div>
      </main>
    </div>
  );
}
