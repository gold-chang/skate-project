'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [log, setLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchLogDetail(id);
    }
  }, [id]);

  const fetchLogDetail = async (logId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('skating_logs')
      .select('*')
      .eq('id', logId)
      .single();

    if (error) {
      alert('일지를 불러오는 중 오류가 발생했습니다.');
      router.push('/');
    } else {
      setLog(data);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('이 일지를 정말 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('skating_logs').delete().eq('id', log.id);
    if (error) {
      alert('삭제 중 오류 발생: ' + error.message);
    } else {
      alert('일지가 삭제되었습니다.');
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-xs text-stone-400">
        일지 정보를 불러오는 중...
      </div>
    );
  }

  if (!log) return null;

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
          Session Detail
        </span>
      </header>

      <main className="w-full max-w-md bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider">
              SKATER
            </span>
            <h1 className="text-lg font-extrabold text-stone-900">{log.user_name}</h1>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider">
              DATE
            </span>
            <span className="text-xs font-bold text-stone-700">{log.session_date}</span>
          </div>
        </div>

        {log.image_url ? (
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-600">📷 세션 사진</span>
            <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 max-h-96 flex items-center justify-center">
              <a href={log.image_url} target="_blank" rel="noopener noreferrer" className="w-full">
                <img
                  src={log.image_url}
                  alt="세션 사진"
                  className="w-full h-auto max-h-96 object-contain hover:opacity-95 transition-opacity"
                />
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-stone-50 border border-stone-100 rounded-2xl p-6 text-center text-xs text-stone-400">
            등록된 사진이 없습니다.
          </div>
        )}

        <div>
          <span className="text-xs font-bold text-stone-600 block mb-1">📍 연습 장소</span>
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-100 text-xs font-bold text-stone-800">
            {log.spot_name}
          </div>
        </div>

        {log.practiced_tricks && log.practiced_tricks.length > 0 && (
          <div>
            <span className="text-xs font-bold text-stone-600 block mb-2">🔥 연습한 트릭</span>
            <div className="flex flex-wrap gap-1.5">
              {log.practiced_tricks.map((trick: string, idx: number) => (
                <span
                  key={idx}
                  className="bg-stone-100 text-stone-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-stone-200/80"
                >
                  {trick}
                </span>
              ))}
            </div>
          </div>
        )}

        {log.memo && (
          <div>
            <span className="text-xs font-bold text-stone-600 block mb-1">📝 메모</span>
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">
              {log.memo}
            </div>
          </div>
        )}

        <div className="pt-2 space-y-2">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `${log.user_name}의 스케이트 세션 일지`,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('일지 링크가 복사되었습니다!');
              }
            }}
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-2xl transition-all shadow-sm"
          >
            🔗 링크로 공유하기
          </button>

          <button
            onClick={handleDelete}
            className="w-full py-2.5 bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-500 font-bold text-xs rounded-2xl transition-all"
          >
            🗑️ 일지 삭제하기
          </button>
        </div>
      </main>
    </div>
  );
}
