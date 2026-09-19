import React, { useState, useEffect } from 'react';
import { SupabaseProvider, useSupabase } from './context/SupabaseContext';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { JourneyPage } from './pages/JourneyPage';
import { HomePage } from './pages/HomePage';
import { CampPage } from './pages/CampPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { ProfilePage } from './pages/ProfilePage';
import { Header } from './components/Navigation/Header';
import { BottomNav } from './components/Navigation/BottomNav';
import { TeacherBottomNav } from './components/TeacherBottomNav';
import { TeacherStudentsPage } from './pages/TeacherStudentsPage';
import { WeekDetailModal } from './components/Journey/WeekDetailModal';
import { LessonPlayer } from './components/Lesson/LessonPlayer';
import { ListeningTask } from './components/listening/ListeningTask';
import { WeekRewardModal } from './components/Reward/WeekRewardModal';

const AppRouter: React.FC = () => {
  const {
    session,
    profile,
    loading,
    isRefreshing,
    user,
    activeTab,
    setActiveTab,
    selectedWeekForModal,
    showWeekModal,
    closeWeekModal,
    activeNode,
    activeWeek,
    showLessonModal,
    closeLessonModal,
    activeListeningTask,
    closeListeningTask,
  } = useSupabase();

  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  // If user signs out or has no session, guarantee view is 'login'
  useEffect(() => {
    if (!session) {
      setAuthView('login');
    }
  }, [session]);

  console.log('🔍 [App.tsx] profile:', profile, 'loading:', loading, 'isRefreshing:', isRefreshing, 'hasSession:', !!session, 'authView:', authView);

  // Loading state (initial loading, or refresh while profile is not yet available)
  if (loading || (isRefreshing && !profile)) {
    return (
      <div className="min-h-screen bg-[#F8F9F5] flex flex-col items-center justify-center font-arabic antialiased text-slate-800">
        <div className="w-16 h-16 rounded-3xl bg-[#F0F9F0] border-2 border-[#006304] text-[#006304] flex items-center justify-center text-3xl mb-4 shadow-sm animate-pulse">
          🌱
        </div>
        <h3 className="font-heading font-black text-lg text-[#006304]">رحلة وِرد</h3>
        <p className="text-xs font-bold text-gray-500 mt-1">جاري التحميل والمزامنة...</p>
      </div>
    );
  }

  // Not signed in: Always default to LoginPage, allow toggle to SignupPage
  if (!session) {
    if (authView === 'signup') {
      return <SignupPage onBackToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onGoToSignup={() => setAuthView('signup')} />;
  }

  // Signed in, but no profile yet and not currently refreshing:
  // If user explicitly switched to login, sign them out so they can log in cleanly with another account
  if (!profile && !isRefreshing) {
    if (authView === 'login') {
      return <LoginPage onGoToSignup={() => setAuthView('signup')} />;
    }
    return <SignupPage onBackToLogin={() => setAuthView('login')} />;
  }

  // Teacher Flow
  if (profile.role === 'teacher') {
    return (
      <div className="min-h-screen bg-[#F8F9F5] text-slate-900 font-arabic flex flex-col antialiased">
        <Header />
        <main className="flex-1 overflow-x-hidden">
          {activeTab === 'profile' ? (
            <ProfilePage />
          ) : activeTab === 'students' ? (
            <TeacherStudentsPage />
          ) : activeTab === 'journey' ? (
            <div>
              {/* Teacher Preview Banner */}
              <div className="bg-[#006304] text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs">
                <span>👁️ وضع معاينة منهج جزء عم (للمعلم فقط)</span>
                <button
                  onClick={() => setActiveTab('teacher')}
                  className="bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer"
                >
                  العودة للوحة المعلم ↩
                </button>
              </div>
              <JourneyPage />
            </div>
          ) : (
            <TeacherDashboard />
          )}
        </main>
        <TeacherBottomNav />
      </div>
    );
  }

  // Student Flow (Default with full Journey, Camp, Profile, Achievements)
  return (
    <div className="min-h-screen bg-[#F8F9F5] text-slate-900 font-arabic flex flex-col antialiased">
      <Header />

      <main className="flex-1 overflow-x-hidden">
        {activeTab === 'home' && <HomePage />}
        {activeTab === 'journey' && <JourneyPage />}
        {activeTab === 'camp' && <CampPage />}
        {activeTab === 'achievements' && <AchievementsPage />}
        {activeTab === 'profile' && <ProfilePage />}
        {activeTab === 'teacher' && <TeacherDashboard />}
      </main>

      <BottomNav />

      {/* Modals */}
      {showWeekModal && selectedWeekForModal && (
        <WeekDetailModal week={selectedWeekForModal} onClose={closeWeekModal} />
      )}

      {showLessonModal && activeNode && activeWeek && (
        <LessonPlayer node={activeNode} week={activeWeek} onClose={closeLessonModal} />
      )}

      {activeListeningTask && (
        <ListeningTask
          node={activeListeningTask.node}
          week={activeListeningTask.week}
          onClose={closeListeningTask}
        />
      )}

      <WeekRewardModal />
    </div>
  );
};

export default function App() {
  return (
    <SupabaseProvider>
      <AppRouter />
    </SupabaseProvider>
  );
}
