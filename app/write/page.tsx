'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/imageResize';

const TRICK_OPTIONS = [
  'Ollie (알리)',
  'Frontside 180',
  'Backside 180',
  'Kickflip (킥플립)',
  'Heelflip (힐플립)',
  'Shuvit (샤빗)',
  'Pop Shuvit (팝샤빗)',
  '50-50 Grind',
  'Boardslide',
];

export default function WriteReportPage() {
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);

  // 기본 정보
  const [studentName, setStudentName] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [shopName, setShopName] = useState('시흥 뱅크트릭스');
  const [spotName, setSpotName] = useState('실내 파크');
  const [lessonRound, setLessonRound] = useState('1회차');

  // 트릭 & 피드백
  const [selectedTricks, setSelectedTricks] = useState<any[]>([]);
  const [instructorNote, setInstructorNote] = useState('');
  const [nextGoal, setNextGoal] = useState('');

  // 📷 사진 첨부 상태
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*').order('name');
    if (data && data.length > 0) {
      setProfiles(data);
      setStudentName(data[0].name);
      // 강사가 구분되어 있다면 기본값 설정
      const instructor = data.find((p) => p.role === 'instructor');
      setInstructorName(instructor ? instructor.name : data[0].name);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const toggleTrick = (trickName: string) => {
    const exists = selectedTricks.find((t) => t.name === trickName);
    if (exists) {
      setSelectedTricks(selectedTricks.filter((t) => t.name !== trickName));
    } else {
      setSelectedTricks([...selectedTricks, { name: trickName, badge: '완성', desc: '' }]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl = '';

    // 📷 이미지 압축 및 수파베이스 저장
    if (imageFile) {
      try {
        const compressedBlob = await compressImage(imageFile, 1000, 0.7);
        const fileName = `lesson_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('skate_photos')
          .upload(fileName, compressedBlob, { contentType: 'image/jpeg' });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('skate_photos').getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }
      } catch (err) {
        console.error('이미지 업로드 오류:', err);
      }
    }

    const { error } = await supabase.from('lesson_reports').insert([
      {
        student_name: studentName,
        instructor_name: instructorName,
        shop_name: shopName,
        spot_name: spotName,
        lesson_round: lessonRound,
        mastered_tricks: selectedTricks,
        instructor_note: instructorNote,
        next_goal: nextGoal,
        image_url: imageUrl,
      },
    ]);

    setLoading(false);

    if (error) {
      alert('저장 실패: ' + error.message);
    } else {
      alert('🎉 강습 피드백이 생성되었습니다!');
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
          New Feedback
        </span>
      </header>

      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900">🎓 강습 피드백 작성</h1>
          <p className="text-xs text-stone-500 mt-1">수강생에게 전할 피드백 리포트를 작성하세요.</p>
        </div>

        {/* 1. 수강생 선택 */}
        <div>
          <label className="block text-xs font-bold text-stone-600 mb-2">👤 수강생 선택</label>
          <div className="flex flex-wrap gap-1.5">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setStudentName(p.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  studentName === p.name
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* 2. 강사 이름 & 회차 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1.5">👨‍🏫 담당 강사</label>
            <input
              type="text"
              value={instructorName}
              onChange={(e) => setInstructorName(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1.5">📌 회차</label>
            <input
              type="text"
              value={lessonRound}
              onChange={(e) => setLessonRound(e.target.value)}
              placeholder="예: 1회차"
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* 3. 📷 강습 사진 첨부 */}
        <div>
          <label className="block text-xs font-bold text-stone-600 mb-1.5">📷 강습/자세 사진 첨부</label>
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

        {/* 4. 달성 트릭 선택 */}
        <div>
          <label className="block text-xs font-bold text-stone-600 mb-2">🏆 오늘 연습/달성한 트릭</label>
          <div className="flex flex-wrap gap-1.5">
            {TRICK_OPTIONS.map((trick, index) => {
              const isSelected = selectedTricks.some((t) => t.name === trick);
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
        </div>

        {/* 5. 코치 피드백 노트 */}
        <div>
          <label className="block text-xs font-bold text-stone-600 mb-1.5">💬 강사 피드백</label>
          <textarea
            rows={4}
            placeholder="오늘의 자세 교정 포인트나 피드백을 작성해 주세요."
            value={instructorNote}
            onChange={(e) => setInstructorNote(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs text-stone-900 focus:outline-none"
          />
        </div>

        {/* 6. 다음 목표 */}
        <div>
          <label className="block text-xs font-bold text-stone-600 mb-1.5">🎯 다음 시간 목표</label>
          <input
            type="text"
            placeholder="예: 알리 장애물 넘기 시도"
            value={nextGoal}
            onChange={(e) => setNextGoal(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-2xl transition-all shadow-md active:scale-[0.98]"
        >
          {loading ? '저장 중...' : '🎓 강습 피드백 제출하기'}
        </button>
      </form>
    </div>
  );
}
