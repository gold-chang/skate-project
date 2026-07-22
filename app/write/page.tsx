'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LessonWritePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 기본 정보
  const [shopName, setShopName] = useState('스케이트보드 아카데미');
  const [studentName, setStudentName] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [spotName, setSpotName] = useState('');
  const [customSpot, setCustomSpot] = useState('');
  const [lessonRound, setLessonRound] = useState('1회차');

  // 트릭 관리
  const [tricks, setTricks] = useState<{ name: string; badge: string }[]>([]);
  const [trickInput, setTrickInput] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('성공');

  // 피드백 및 메모
  const [instructorNote, setInstructorNote] = useState('');
  const [nextGoal, setNextGoal] = useState('');

  // 사진 업로드
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 스팟 목록
  const spotOptions = ['뚝섬 스케이트파크', '보라매 스케이트파크', '난지 스케이트파크', '시흥 스케이트파크', '직접 입력'];

  // 이미지 선택 시 미리보기
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 트릭 추가
  const handleAddTrick = () => {
    if (!trickInput.trim()) return;
    setTricks([...tricks, { name: trickInput.trim(), badge: selectedBadge }]);
    setTrickInput('');
  };

  // 트릭 삭제
  const handleRemoveTrick = (index: number) => {
    setTricks(tricks.filter((_, i) => i !== index));
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert('수강생 이름을 입력해 주세요.');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;

      // 이미지 업로드 로직 (Supabase Storage)
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `lesson_${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
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

      const finalSpot = spotName === '직접 입력' ? customSpot : spotName;

      // DB 저장
      const { error } = await supabase.from('lesson_reports').insert([
        {
          shop_name: shopName,
          student_name: studentName,
          instructor_name: instructorName,
          spot_name: finalSpot,
          lesson_round: lessonRound,
          mastered_tricks: tricks,
          instructor_note: instructorNote,
          next_goal: nextGoal,
          image_url: imageUrl,
        },
      ]);

      if (error) {
        alert('저장 중 오류가 발생했습니다: ' + error.message);
      } else {
        alert('강습 피드백 리포트가 등록되었습니다!');
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
          New Lesson Report
        </span>
      </header>

      <main className="w-full max-w-md bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 수강생 / 강사 이름 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">👤 수강생 이름 *</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="예: 홍길동"
                required
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:border-stone-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">🛹 강사 이름</label>
              <input
                type="text"
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                placeholder="예: 김코치"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:border-stone-500"
              />
            </div>
          </div>

          {/* 장소(스팟) 선택 및 입력 */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">📍 연습 장소 (스팟)</label>
            <select
              value={spotName}
              onChange={(e) => setSpotName(e.target.value)}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:border-stone-500 mb-2"
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
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:border-stone-500"
              />
            )}
          </div>

          {/* 회차 정보 */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">📌 레슨 회차</label>
            <input
              type="text"
              value={lessonRound}
              onChange={(e) => setLessonRound(e.target.value)}
              placeholder="예: 3회차 또는 원데이 클래스"
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:border-stone-500"
            />
          </div>

          {/* 🔥 연습 / 마스터 기술 추가 */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-600">🏆 연습 및 달성한 기술 (트릭)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={trickInput}
                onChange={(e) => setTrickInput(e.target.value)}
                placeholder="예: 알리, 푸시오프"
                className="flex-1 p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:border-stone-500"
              />
              <select
                value={selectedBadge}
                onChange={(e) => setSelectedBadge(e.target.value)}
                className="p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none"
              >
                <option value="성공">성공</option>
                <option value="연습중">연습중</option>
                <option value="완성도UP">완성도UP</option>
              </select>
              <button
                type="button"
                onClick={handleAddTrick}
                className="px-4 py-3 bg-stone-900 text-white font-bold text-xs rounded-2xl hover:bg-stone-800 transition-all"
              >
                추가
              </button>
            </div>

            {/* 추가된 기술 리스트 */}
            {tricks.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {tricks.map((item, index) => (
                  <span
                    key={index}
                    className="bg-stone-100 text-stone-800 text-xs px-3 py-1.5 rounded-full border border-stone-200 flex items-center gap-1.5 font-medium"
                  >
                    <span>{item.name}</span>
                    <span className="text-[10px] bg-stone-200 px-1.5 py-0.5 rounded-md font-bold text-stone-600">
                      {item.badge}
                    </span>
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

          {/* 📷 사진 업로드 */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">📷 강습 사진 첨부</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
            />
            {imagePreview && (
              <div className="mt-2 rounded-2xl overflow-hidden border border-stone-200 max-h-48 flex items-center justify-center bg-stone-50">
                <img src={imagePreview} alt="미리보기" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* 코치 피드백 */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">💬 코치 피드백</label>
            <textarea
              value={instructorNote}
              onChange={(e) => setInstructorNote(e.target.value)}
              rows={3}
              placeholder="수강생의 자세 개선점이나 피드백을 적어주세요."
              className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:border-stone-500 leading-relaxed resize-none"
            />
          </div>

          {/* 다음 목표 */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">🎯 다음 목표</label>
            <input
              type="text"
              value={nextGoal}
              onChange={(e) => setNextGoal(e.target.value)}
              placeholder="예: 다음 시간엔 틱택 10회 연속 도전"
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:border-stone-500"
            />
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-2xl transition-all shadow-sm disabled:bg-stone-300"
          >
            {loading ? '저장 중...' : '🎓 강습 피드백 저장하기'}
          </button>
        </form>
      </main>
    </div>
  );
}
