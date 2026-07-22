'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LogWritePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // DB 마스터 데이터
  const [profiles, setProfiles] = useState<any[]>([]);
  const [spots, setSpots] = useState<any[]>([]);
  const [tricksList, setTricksList] = useState<any[]>([]);

  // 폼 입력값
  const [selectedUser, setSelectedUser] = useState('');
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  // 장소 검색 & 선택
  const [spotSearch, setSpotSearch] = useState('');
  const [selectedSpot, setSelectedSpot] = useState<any>(null);

  // 기술 검색 & 선택
  const [trickSearch, setTrickSearch] = useState('');
  const [selectedTricks, setSelectedTricks] = useState<any[]>([]);

  const [memo, setMemo] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const { data: profData } = await supabase.from('profiles').select('*').order('name');
    if (profData) setProfiles(profData);

    const { data: spotData } = await supabase.from('spots').select('*').order('name');
    if (spotData) setSpots(spotData);

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

  // 장소 필터링
  const filteredSpots = spots.filter((s) =>
    s.name.toLowerCase().includes(spotSearch.toLowerCase())
  );

  // 트릭 필터링
  const filteredTricks = tricksList.filter(
    (t) =>
      t.name.toLowerCase().includes(trickSearch.toLowerCase()) &&
      !selectedTricks.some((st) => st.id === t.id)
  );

  const handleAddTrick = (trick: any) => {
    setSelectedTricks([...selectedTricks, trick]);
    setTrickSearch('');
  };

  const handleRemoveTrick = (id: string) => {
    setSelectedTricks(selectedTricks.filter((t) => t.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) return alert('스케이터를 선택해 주세요.');
    if (!selectedSpot) return alert('연습 장소를 선택해 주세요.');

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

      // 1. 개인 일지 등록
      const { data: logData, error: dbError } = await supabase
        .from('skating_logs')
        .insert([
          {
            user_name: selectedUser,
            session_date: sessionDate,
            spot_id: selectedSpot.id, // UUID 장소 참조
            memo: memo,
            image_url: finalImageUrl,
            instagram_url: instagramUrl,
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      // 2. 선택한 트릭 조인 테이블(log_tricks) 등록
      if (selectedTricks.length > 0 && logData) {
        const trickRows = selectedTricks.map((t) => ({
          log_id: logData.id,
          trick_id: t.id,
        }));
        await supabase.from('log_tricks').insert(trickRows);
      }

      alert('🎉 개인 일지가 등록되었습니다!');
      router.push('/');
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

          {/* 📍 장소 검색 및 선택 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-600">📍 연습 장소 (스팟) 검색 *</label>
            {selectedSpot ? (
              <div className="flex items-center justify-between bg-stone-900 text-white p-3 rounded-2xl text-xs font-bold">
                <span>📍 {selectedSpot.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedSpot(null)}
                  className="text-stone-400 hover:text-white"
                >
                  변경 ✕
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <input
                  type="text"
                  value={spotSearch}
                  onChange={(e) => setSpotSearch(e.target.value)}
                  placeholder="파크 이름 검색..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none"
                />
                <div className="max-h-32 overflow-y-auto border border-stone-100 rounded-2xl divide-y divide-stone-100 bg-stone-50">
                  {filteredSpots.length === 0 ? (
                    <div className="p-3 text-xs text-stone-400">검색 결과가 없습니다.</div>
                  ) : (
                    filteredSpots.map((spot) => (
                      <div
                        key={spot.id}
                        onClick={() => {
                          setSelectedSpot(spot);
                          setSpotSearch('');
                        }}
                        className="p-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-200/60 cursor-pointer"
                      >
                        {spot.name}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 🔥 기술 검색 및 추가 */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-600">🔥 연습한 기술 (트릭) 검색</label>
            <input
              type="text"
              value={trickSearch}
              onChange={(e) => setTrickSearch(e.target.value)}
              placeholder="기술 이름 검색 (예: 알리, 플립...)"
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none"
            />

            {trickSearch.trim() && (
              <div className="max-h-32 overflow-y-auto border border-stone-100 rounded-2xl divide-y divide-stone-100 bg-stone-50">
                {filteredTricks.length === 0 ? (
                  <div className="p-3 text-xs text-stone-400">일치하는 기술이 없습니다.</div>
                ) : (
                  filteredTricks.map((trick) => (
                    <div
                      key={trick.id}
                      onClick={() => handleAddTrick(trick)}
                      className="p-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-200/60 cursor-pointer flex justify-between items-center"
                    >
                      <span>{trick.name}</span>
                      <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded">
                        {trick.category}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 선택된 기술 칩 */}
            {selectedTricks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedTricks.map((trick) => (
                  <span
                    key={trick.id}
                    className="bg-stone-900 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold"
                  >
                    <span>{trick.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTrick(trick.id)}
                      className="text-stone-400 hover:text-white"
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
