'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LogWritePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // DB에서 불러온 목록
  const [profiles, setProfiles] = useState<any[]>([]);
  const [spots, setSpots] = useState<any[]>([]);
  const [tricksList, setTricksList] = useState<any[]>([]);

  // 폼 입력 상태
  const [selectedUser, setSelectedUser] = useState('');
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSpotId, setSelectedSpotId] = useState('');

  // 선택된 트릭 목록 (ID + Name 저장)
  const [selectedTricks, setSelectedTricks] = useState<{ id: number; name: string }[]>([]);
  const [trickSelectId, setTrickSelectId] = useState('');

  const [memo, setMemo] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    // 1. 프로필
    const { data: profData } = await supabase.from('profiles').select('*').order('name');
    if (profData) setProfiles(profData);

    // 2. DB 장소 목록 불러오기
    const { data: spotData } = await supabase.from('spots').select('*').order('name');
    if (spotData) setSpots(spotData);

    // 3. DB 기술 목록 불러오기
    const { data: trickData } = await supabase.from('tricks').select('*').order('name');
    if (trickData) setTricksList(trickData);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 기존 트릭 목록에서 선택하여 추가
  const handleAddTrick = () => {
    if (!trickSelectId) return;
    const found = tricksList.find((t) => String(t.id) === trickSelectId);
    if (found && !selectedTricks.some((t) => t.id === found.id)) {
      setSelectedTricks([...selectedTricks, { id: found.id, name: found.name }]);
    }
    setTrickSelectId('');
  };

  const handleRemoveTrick = (id: number) => {
    setSelectedTricks(selectedTricks.filter((t) => t.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) return alert('스케이터를 선택해 주세요.');
    if (!selectedSpotId) return alert('연습 장소를 선택해 주세요.');

    setLoading(true);

    try {
      let finalImageUrl: string | null = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop() || 'jpg';
        const fileName = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('skate_photos')
          .upload(fileName, imageFile, { cacheControl: '3600', upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('skate_photos')
            .getPublicUrl(fileName);
          if (urlData?.publicUrl) finalImageUrl = urlData.publicUrl;
        }
      }

      const targetSpot = spots.find((s) => String(s.id) === selectedSpotId);

      const { error: dbError } = await supabase.from('skating_logs').insert([
        {
          user_name: selectedUser,
          session_date: sessionDate,
          spot_id: Number(selectedSpotId), // 👈 spot_id 저장
          spot_name: targetSpot?.name || '', // 하위 호환성 유지
          practiced_tricks: selectedTricks.map((t) => t.name), // 이름배열 및 ID 매핑 저장
          memo: memo,
          image_url: finalImageUrl,
          instagram_url: instagramUrl,
        },
      ]);

      if (dbError) {
        alert('DB 저장 오류: ' + dbError.message);
      } else {
        alert('🎉 개인 일지가 등록되었습니다!');
        router.push('/');
      }
    } catch (err: any) {
      alert('오류 발생: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 flex flex-col items-center p-4 sm:p-6 font-sans">
      <header className="w-full max-w-md my-4 flex items-center justify-between">
        <button onClick={() => router.push('/')} className="text-xs font-bold text-stone-500 hover:text-stone-900">
          ← 취소
        </button>
        <span className="text-xs font-bold tracking-wider text-stone-600 bg-stone-200/60 px-3 py-1 rounded-full">
          New Skate Log
        </span>
      </header>

      <main className="w-full max-w-md bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 스케이터 선택 */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">👤 스케이터 *</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none"
              required
            >
              <option value="">스케이터 선택</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* 연습 날짜 */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">📅 연습 날짜 *</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none"
              required
            />
          </div>

          {/* 연습 장소 (DB Spots ID 기반) */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">📍 연습 장소 (스팟) *</label>
            <select
              value={selectedSpotId}
              onChange={(e) => setSelectedSpotId(e.target.value)}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none"
              required
            >
              <option value="">장소를 선택하세요</option>
              {spots.map((spot) => (
                <option key={spot.id} value={spot.id}>
                  {spot.name}
                </option>
              ))}
            </select>
          </div>

          {/* 연습한 트릭 (DB Tricks 선택) */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">🔥 연습한 트릭</label>
            <div className="flex gap-2">
              <select
                value={trickSelectId}
                onChange={(e) => setTrickSelectId(e.target.value)}
                className="flex-1 p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none"
              >
                <option value="">등록된 기술 선택</option>
                {tricksList.map((trick) => (
                  <option key={trick.id} value={trick.id}>
                    {trick.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddTrick}
                className="px-4 py-3 bg-stone-900 text-white font-bold text-xs rounded-2xl hover:bg-stone-800"
              >
                추가
              </button>
            </div>
            {selectedTricks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {selectedTricks.map((item) => (
                  <span
                    key={item.id}
                    className="bg-stone-100 text-stone-800 text-xs px-3 py-1 rounded-full border border-stone-200 flex items-center gap-1 font-medium"
                  >
                    <span>{item.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTrick(item.id)}
                      className="text-stone-400 hover:text-red-500 font-bold ml-1"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 인스타 링크 */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">📸 인스타그램 게시물/릴스 링크</label>
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none"
            />
          </div>

          {/* 사진 첨부 */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">📷 세션 사진 첨부</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700"
            />
            {imagePreview && (
              <div className="mt-2 rounded-2xl overflow-hidden border border-stone-200 max-h-48 flex items-center justify-center bg-stone-50">
                <img src={imagePreview} alt="미리보기" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">📝 메모</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              placeholder="오늘 느낀점이나 보완할 점을 자유롭게 기록하세요."
              className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-2xl transition-all disabled:bg-stone-300"
          >
            {loading ? '저장 중...' : '🛹 개인 일지 저장하기'}
          </button>
        </form>
      </main>
    </div>
  );
}
