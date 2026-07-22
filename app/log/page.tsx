'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/imageResize';

const DEFAULT_SPOTS = ['뚝섬 스케이트파크', '보라매 스케이트파크', '난지 스케이트파크', '시흥 뱅크트릭스'];
const DEFAULT_TRICKS = ['Ollie (알리)', 'FS 180', 'BS 180', 'Kickflip (킥플립)', 'Heelflip (힐플립)', 'Shuvit (샤빗)'];

export default function SkatingLogPage() {
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [userName, setUserName] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);

  // 스팟 / 트릭 / 메모
  const [spotList, setSpotList] = useState<string[]>(DEFAULT_SPOTS);
  const [selectedSpot, setSelectedSpot] = useState(DEFAULT_SPOTS[0]);
  const [customSpot, setCustomSpot] = useState('');
  const [isCustomSpot, setIsCustomSpot] = useState(false);
  const [trickList, setTrickList] = useState<string[]>(DEFAULT_TRICKS);
  const [selectedTricks, setSelectedTricks] = useState<string[]>([]);
  const [customTrick, setCustomTrick] = useState('');
  const [memo, setMemo] = useState('');

  // 📷 사진 관련 상태
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*').order('name');
    if (data && data.length > 0) {
      setProfiles(data);
      setUserName(data[0].name);
    }
  };

  // 이미지 선택 및 미리보기
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddCustomSpot = () => {
    if (!customSpot.trim()) return;
    setSpotList([...spotList, customSpot]);
    setSelectedSpot(customSpot);
    setCustomSpot('');
    setIsCustomSpot(false);
  };

  const toggleTrick = (trick: string) => {
    if (selectedTricks.includes(trick)) {
      setSelectedTricks(selectedTricks.filter((t) => t !== trick));
    } else {
      setSelectedTricks([...selectedTricks, trick]);
    }
  };

  const handleAddCustomTrick = () => {
    if (!customTrick.trim()) return;
    if (!trickList.includes(customTrick)) setTrickList([...trickList, customTrick]);
    if (!selectedTricks.includes(customTrick)) setSelectedTricks([...selectedTricks, customTrick]);
    setCustomTrick('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName) {
      alert('스케이터를 선택해 주세요!');
      return;
    }
    setLoading(true);

    let imageUrl = '';

    // 📷 이미지 압축 및 수파베이스 업로드
    if (imageFile) {
      try {
        const compressedBlob = await compressImage(imageFile, 1000, 0.7); // 최대너비 1000px, 70% 화질로 압축
        const fileName = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('skate_photos')
          .upload(fileName, compressedBlob, { contentType: 'image/jpeg' });

        if (uploadError) {
          console.error('이미지 업로드 에러:', uploadError);
        } else {
          const { data: urlData } = supabase.storage.from('skate_photos').getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }
      } catch (err) {
        console.error('이미지 압축 에러:', err);
      }
    }

    const finalSpot = isCustomSpot ? customSpot : selectedSpot;

    const { error } = await supabase.from('skating_logs').insert([
      {
        user_name: userName,
        spot_name: finalSpot,
        practiced_tricks: selectedTricks,
        memo: memo,
        session_date: sessionDate,
        image_url: imageUrl,
      },
    ]);

    setLoading(false);

    if (error) {
      alert('저장 중 오류 발생: ' + error.message);
    } else {
      alert('🎉 오늘의 세션 기록이 완료되었습니다!');
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 flex flex-col items-center p-4 sm:p-6 font-sans">
      <header className="w-full max-w-md my-4 flex items-center justify-between">
        <a href="/" className="text-xs font-bold text-stone-500 hover:text-stone-900">
          ← 메인으로
        </a>
        <span className="text-xs font-bold tracking-wider text-stone-600 bg-stone-200/60 px-3 py-1 rounded-full">
          New Session
        </span>
      </header>

      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900">🛹 세션 일지 기록</h1>
          <p className="text-xs text-stone-500 mt-1">오늘 라이딩을 즐겁게 기록해보세요.</p>
        </div>

        {/* 1. 스케이터 프로필 선택 */}
        <div>
          <label className="block text-xs font-bold text-stone-600 mb-2">👤 스케이터 선택</label>
          <div className="flex flex-wrap gap-1.5">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setUserName(p.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  userName === p.name
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* 2. 날짜 선택 */}
        <div>
          <label className="block text-xs font-bold text-stone-600 mb-1.5">📅 날짜 선택</label>
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-stone-400 font-medium"
            required
          />
        </div>

        {/* 3. 📷 사진 첨부 (자동 압축 기능 적용) */}
        <div>
          <label className="block text-xs font-bold text-stone-600 mb-1.5">📷 세션 사진 첨부</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-stone-100 file:text-stone-800 hover:file:bg-stone-200 cursor-pointer"
          />
          {imagePreview && (
            <div className="mt-3 relative rounded-2xl overflow-hidden border border-stone-200 max-h-48 flex justify-center bg-stone-50">
              <img src={imagePreview} alt="미리보기" className="object-cover w-full h-full" />
            </div>
          )}
        </div>

        {/* 4. 스팟 선택 */}
        <div>
          <label className="block text-xs font-bold text-stone-600 mb-1.5">📍 타러 간 스팟</label>
          {!isCustomSpot ? (
            <div className="space-y-2">
              <select
                value={selectedSpot}
                onChange={(e) => setSelectedSpot(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-stone-400 font-medium"
              >
                {spotList.map((spot, i) => (
                  <option key={i} value={spot}>{spot}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsCustomSpot(true)}
                className="text-xs text-stone-500 hover:text-stone-900 underline font-medium"
              >
                + 새로운 스팟 직접 입력
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="스팟 이름 입력"
                  value={customSpot}
                  onChange={(e) => setCustomSpot(e.target.value)}
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-stone-400"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSpot}
                  className="px-4 py-2.5 bg-stone-900 text-white font-bold text-xs rounded-2xl"
                >
                  추가
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomSpot(false)}
                className="text-xs text-stone-400 hover:underline"
              >
                ← 목록에서 선택
              </button>
            </div>
          )}
        </div>

        {/* 5. 트릭 선택 */}
        <div>
          <label className="block text-xs font-bold text-stone-600 mb-2">🔥 오늘 시도/성공한 트릭</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {trickList.map((trick, index) => {
              const isSelected = selectedTricks.includes(trick);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleTrick(trick)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                  }`}
                >
                  {isSelected ? '✓ ' : ''}{trick}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="새 트릭 추가..."
              value={customTrick}
              onChange={(e) => setCustomTrick(e.target.value)}
              className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-400"
            />
            <button
              type="button"
              onClick={handleAddCustomTrick}
              className="px-3.5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-2xl"
            >
              + 추가
            </button>
          </div>
        </div>

        {/* 6. 메모 */}
        <div>
          <label className="block text-xs font-bold text-stone-600 mb-1.5">📝 한줄 메모</label>
          <textarea
            rows={3}
            placeholder="오늘의 느낌이나 다음 목표를 적어보세요."
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs text-stone-900 focus:outline-none focus:border-stone-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-2xl transition-all shadow-md active:scale-[0.98]"
        >
          {loading ? '기록 및 이미지 압축 저장 중...' : '🛹 세션 일지 저장하기'}
        </button>
      </form>
    </div>
  );
}
