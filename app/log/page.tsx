'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LogWritePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [customUser, setCustomUser] = useState('');

  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [spotName, setSpotName] = useState('');
  const [customSpot, setCustomSpot] = useState('');

  const [tricks, setTricks] = useState<string[]>([]);
  const [trickInput, setTrickInput] = useState('');

  const [memo, setMemo] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const spotOptions = [
    '뚝섬 스케이트파크',
    '보라매 스케이트파크',
    '난지 스케이트파크',
    '시흥 스케이트파크',
    '직접 입력',
  ];

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*').order('name');
    if (data) setProfiles(data);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddTrick = () => {
    if (!trickInput.trim()) return;
    setTricks([...tricks, trickInput.trim()]);
    setTrickInput('');
  };

  const handleRemoveTrick = (index: number) => {
    setTricks(tricks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalUser = selectedUser === '직접 입력' ? customUser : selectedUser;
    const finalSpot = spotName === '직접 입력' ? customSpot : spotName;

    if (!finalUser.trim()) {
      alert('스케이터 이름을 입력해 주세요.');
      return;
    }
    if (!finalSpot.trim()) {
      alert('연습 장소를 입력해 주세요.');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `log_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('skate_photos')
          .upload(fileName, imageFile);

        if (uploadError) {
          console.error('이미지 업로드 실패:', uploadError);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('skate_photos')
            .getPublicUrl(fileName);
          imageUrl = publicUrlData.publicUrl;
        }
      }

      const { error } = await supabase.from('skating_logs').insert([
        {
          user_name: finalUser,
          session_date: sessionDate,
          spot_name: finalSpot,
          practiced_tricks: tricks,
          memo: memo,
          image_url: imageUrl,
        },
      ]);

      if (error) {
        alert('저장 중 오류가 발생했습니다: ' + error.message);
      } else {
        alert('개인 일지가 등록되었습니다!');
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
        <button
          onClick={() => router.push('/')}
          className="text-xs font-bold text-stone-500 hover:text-stone-900"
        >
          ← 취소
        </button>
        <span className="text-xs font-bold tracking-wider text-stone-600 bg-stone-200/60 px-3 py-1 rounded-full">
          New Skate Log
        </span>
      </header>

      <main className="w-full max-w-md bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">
              👤 스케이터 *
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none mb-2"
              required
            >
              <option value="">스케이터 선택</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
              <option value="직접 입력">직접 입력</option>
            </select>
            {selectedUser === '직접 입력' && (
              <input
                type="text"
                value={customUser}
                onChange={(e) => setCustomUser(e.target.value)}
                placeholder="이름을 입력하세요"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">
              📅 연습 날짜 *
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">
              📍 연습 장소 (스팟) *
            </label>
            <select
              value={spotName}
              onChange={(e) => setSpotName(e.target.value)}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none mb-2"
              required
            >
              <option value="">장소를 선택하세요</option>
              {spotOptions.map((spot, idx) => (
                <option key={idx} value={spot}>
                  {spot}
                </option>
              ))}
            </select>
            {spotName === '직접 입력' && (
              <input
                type="text"
                value={customSpot}
                onChange={(e) => setCustomSpot(e.target.value)}
                placeholder="장소명을 입력하세요"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">
              🔥 연습한 트릭
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={trickInput}
                onChange={(e) => setTrickInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTrick();
                  }
                }}
                placeholder="예: 알리, 드롭인"
                className="flex-1 p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTrick}
                className="px-4 py-3 bg-stone-900 text-white font-bold text-xs rounded-2xl hover:bg-stone-800"
              >
                추가
              </button>
            </div>
            {tricks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {tricks.map((item, index) => (
                  <span
                    key={index}
                    className="bg-stone-100 text-stone-800 text-xs px-3 py-1 rounded-full border border-stone-200 flex items-center gap-1 font-medium"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTrick(index)}
                      className="text-stone-400 hover:text-red-500 font-bold ml-1"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">
              📷 세션 사진 첨부
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
            />
            {imagePreview && (
              <div className="mt-2 rounded-2xl overflow-hidden border border-stone-200 max-h-48 flex items-center justify-center bg-stone-50">
                <img
                  src={imagePreview}
                  alt="미리보기"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">
              📝 메모
            </label>
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
            className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-2xl transition-all shadow-sm disabled:bg-stone-300"
          >
            {loading ? '저장 중...' : '🛹 개인 일지 저장하기'}
          </button>
        </form>
      </main>
    </div>
  );
}
