'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminTricksPage() {
  const router = useRouter();
  const [tricks, setTricks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 폼 입력 상태
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState('중');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTricks();
  }, []);

  const fetchTricks = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tricks').select('*').order('name');
    if (!error && data) {
      setTricks(data);
    }
    setLoading(false);
  };

  // 기술 저장 (추가 / 수정)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('기술 이름을 입력해 주세요.');

    if (editingId) {
      const { error } = await supabase
        .from('tricks')
        .update({ name: name.trim(), difficulty })
        .eq('id', editingId);

      if (error) alert('수정 중 오류 발생: ' + error.message);
      else {
        alert('기술 정보가 수정되었습니다.');
        resetForm();
        fetchTricks();
      }
    } else {
      const { error } = await supabase
        .from('tricks')
        .insert([{ name: name.trim(), difficulty }]);

      if (error) alert('추가 중 오류 발생: ' + error.message);
      else {
        alert('새로운 기술이 추가되었습니다.');
        resetForm();
        fetchTricks();
      }
    }
  };

  const handleEdit = (trick: any) => {
    setEditingId(trick.id);
    setName(trick.name);
    setDifficulty(trick.difficulty || '중');
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDifficulty('중');
  };

  const handleDelete = async (id: string, trickName: string) => {
    if (!confirm(`'${trickName}' 기술을 정말 삭제하시겠습니까?`)) return;

    const { error } = await supabase.from('tricks').delete().eq('id', id);
    if (error) alert('삭제 중 오류 발생: ' + error.message);
    else {
      alert('기술이 삭제되었습니다.');
      fetchTricks();
    }
  };

  // 난이도별 뱃지 색상
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case '최상':
        return <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-200">🔥 최상</span>;
      case '상':
        return <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full border border-red-200">🔴 상</span>;
      case '중':
        return <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200">🟡 중</span>;
      case '하':
      default:
        return <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">🟢 하</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 flex flex-col items-center p-4 sm:p-6 font-sans">
      <header className="w-full max-w-md my-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="text-xs font-bold text-stone-500 hover:text-stone-900"
        >
          ← 대시보드로 돌아가기
        </button>
        <span className="text-xs font-bold tracking-wider text-stone-600 bg-stone-200/60 px-3 py-1 rounded-full">
          Admin: Trick Management
        </span>
      </header>

      <main className="w-full max-w-md bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm space-y-6">
        <div>
          <h1 className="text-base font-extrabold text-stone-900 mb-1">🛠 기술 난이도 관리</h1>
          <p className="text-xs text-stone-500">일지 및 레슨 피드백에 사용될 기술과 난이도를 관리합니다.</p>
        </div>

        {/* 기술 등록/수정 폼 */}
        <form onSubmit={handleSave} className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-stone-700">
              {editingId ? '✏️ 기술 수정' : '➕ 새 기술 등록'}
            </span>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[10px] text-stone-400 hover:text-stone-700 font-bold"
              >
                취소
              </button>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-500 mb-1">기술명 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: Kickflip, Ollie, Shove-it"
              className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-500 mb-1">기술 난이도 *</label>

            <div className="grid grid-cols-4 gap-1.5">
              {['하', '중', '상', '최상'].map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    difficulty === diff
                      ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-stone-900 text-white font-bold text-xs rounded-xl hover:bg-stone-800 transition-all mt-2"
          >
            {editingId ? '수정 완료' : '기술 등록하기'}
          </button>
        </form>

        {/* 등록된 기술 목록 */}
        <div className="space-y-2">
          <h2 className="text-xs font-extrabold text-stone-900">
            📋 등록된 기술 목록 ({tricks.length}개)
          </h2>

          {loading ? (
            <div className="text-xs text-stone-400 py-4 text-center">목록 불러오는 중...</div>
          ) : tricks.length === 0 ? (
            <div className="text-xs text-stone-400 py-4 text-center bg-stone-50 rounded-2xl border border-stone-100">
              등록된 기술이 없습니다.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
              {tricks.map((trick) => (
                <div
                  key={trick.id}
                  className="p-3 bg-stone-50 border border-stone-100 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900">{trick.name}</span>
                    {getDifficultyBadge(trick.difficulty)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEdit(trick)}
                      className="text-[11px] font-bold text-stone-500 hover:text-stone-900 px-2 py-1 bg-stone-200/60 rounded-lg"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(trick.id, trick.name)}
                      className="text-[11px] font-bold text-red-500 hover:text-red-700 px-2 py-1 bg-red-50 rounded-lg"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
