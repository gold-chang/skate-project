'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LessonWritePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // DB 마스터 데이터 목록
  const [students, setStudents] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [spots, setSpots] = useState<any[]>([]);
  const [tricksList, setTricksList] = useState<any[]>([]);

  // 폼 입력값
  const [studentName, setStudentName] = useState('');
  const [shopName, setShopName] = useState('스케이트보드 아카데미');
  const [instructorName, setInstructorName] = useState('');
  const [lessonRound, setLessonRound] = useState('1회차');

  // 장소 검색 & 선택
  const [spotSearch, setSpotSearch] = useState('');
  const [selectedSpot, setSelectedSpot] = useState<any>(null);

  // 기술 검색 & 선택
  const [trickSearch, setTrickSearch] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('성공');
  const [selectedTricks, setSelectedTricks] = useState<any[]>([]);

  // 피드백 & 인스타 & 사진
  const [instructorNote, setInstructorNote] = useState('');
  const [nextGoal, setNextGoal] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    // 1. 전체 프로필 불러오기
    const { data: profData } = await supabase.from('profiles').select('*').order('name');
    if (profData) {
      // 강사도 수강생이 될 수 있으므로 전체 유저를 수강생 목록에 대입
      setStudents(profData);

      // is_instructor === true 인 유저만 강사 목록으로 필터링
      const filteredInstructors = profData.filter((p) => p.is_instructor === true);
      
      // 만약 DB에 is_instructor로 지정된 강사가 아직 없다면 전체 목록 제공
      if (filteredInstructors.length > 0) {
        setInstructors(filteredInstructors);
      } else {
        setInstructors(profData);
      }
    }

    // 2. 장소(spots) 목록
    const { data: spotData } = await supabase.from('spots').select('*').order('name');
    if (spotData) setSpots(spotData);

    // 3. 기술(tricks) 목록
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
    setSelectedTricks([...selectedTricks, { ...trick, badge: selectedBadge }]);
    setTrickSearch('');
  };

  const handleRemoveTrick = (id: string) => {
    setSelectedTricks(selectedTricks.filter((t) => t.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentName) return alert('수강생 이름을 선택해 주세요.');
    if (!instructorName) return alert('담당 강사를 선택해 주세요.');
    if (!selectedSpot) return alert('연습 장소를 선택해 주세요.');

    setLoading(true);

    try {
      let finalImageUrl: string | null = null;

      // 1. 사진 파일 업로드
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop() || 'jpg';
        const fileName = `lesson_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

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

      // 2. 강습 리포트 저장
      const { data: lessonData, error: dbError } = await supabase
        .from('lesson_reports')
        .insert([
          {
            shop_name: shopName,
            student_name: studentName,
            instructor_name: instructorName,
            spot_id: selectedSpot.id,
            lesson_round: lessonRound,
            instructor_note: instructorNote,
            next_goal: nextGoal,
            image_url: finalImageUrl,
            instagram_url: instagramUrl,
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      // 3. 교차 테이블(lesson_tricks) 매핑 저장
      if (selectedTricks.length > 0 && lessonData) {
        const trickRows = selectedTricks.map((t) => ({
          lesson_id: lessonData.id,
          trick_id: t.id,
          badge: t.badge,
        }));
        await supabase.from('lesson_tricks').insert(trickRows);
      }

      alert('🎓 강습 피드백 리포트가 성공적으로 등록되었습니다!');
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
          {/* 수강생 선택 (강사 포함 전체 스케이터) */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">👤 수강생 이름 *</label>
            <select
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none"
              required
            >
              <option value="">수강생 선택</option>
              {students.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* 담당 강사 선택 (is_instructor 권한 유저) */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">🛹 담당 강사 *</label>
            <select
              value={instructorName}
              onChange={(e) => setInstructorName(e.target.value)}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none"
              required
            >
              <option value="">담당 강사 선택</option>
              {instructors.map((inst) => (
                <option key={inst.id} value={inst.name}>
                  {inst.name} 코치
                </option>
              ))}
            </select>
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

          {/* 레슨 회차 */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">📌 레슨 회차</label>
            <input
              type="text"
              value={lessonRound}
              onChange={(e) => setLessonRound(e.target.value)}
              placeholder="예: 1회차 또는 원데이 클래스"
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none"
            />
          </div>

          {/* 🔥 기술 검색 및 추가 */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-600">🏆 연습 및 달성한 트릭</label>
            <div className="flex gap-2 mb-1">
              <select
                value={selectedBadge}
                onChange={(e) => setSelectedBadge(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none font-bold"
              >
                <option value="성공">뱃지: 성공</option>
                <option value="연습중">뱃지: 연습중</option>
                <option value="완성도UP">뱃지: 완성도UP</option>
              </select>
            </div>

            <input
              type="text"
              value={trickSearch}
              onChange={(e) => setTrickSearch(e.target.value)}
              placeholder="기술 이름 검색 후 클릭하여 추가..."
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
                      <span className="text-[10px] bg-stone-200 text-stone-700 font-bold px-1.5 py-0.5 rounded">
                        {trick.difficulty || '중'}
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
                    <span className="text-[10px] bg-amber-400 text-stone-900 px-1.5 py-0.2 rounded font-extrabold">
                      {trick.badge}
                    </span>
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

          {/* 📸 인스타그램 링크 */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">📸 인스타그램 게시물/릴스 링크</label>
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none focus:border-pink-400"
            />
          </div>

          {/* 📷 사진 첨부 */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">📷 강습/자세 사진 첨부</label>
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
              className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* 다음 목표 */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">🎯 다음 목표</label>
            <input
              type="text"
              value={nextGoal}
              onChange={(e) => setNextGoal(e.target.value)}
              placeholder="예: 다음 시간에는 틱택 연속 10회 도전"
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs focus:outline-none"
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
