import React, { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { AppView, Role, Profile, TriageSession } from './types';
import ChatWindow from './components/ChatWindow';
import Disclaimer from './components/Disclaimer';
import AuthScreen from './components/auth/AuthScreen';
import PatientDashboard from './components/patient/PatientDashboard';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import { supabase } from './services/supabaseClient';
import { LogoutIcon } from './components/icons/LogoutIcon';
import { Json } from './database.types';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async (user: any) => {
      if (!user) {
        setProfile(null);
        return;
      }
      // Fetch profile without .single() to handle cases where the profile might not exist yet
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id);

      if (error) {
        // Log the actual error message instead of the object
        console.error('Error fetching profile:', error.message);
        setProfile(null);
      } else if (profiles && profiles.length > 0) {
        // Profile found, set it
        setProfile(profiles[0]);
      } else {
        // User exists in auth, but no profile found in the table. This can happen with a delay after signup.
        console.warn(`No profile found for user ID: ${user.id}. The user might need to complete sign-up or there could be a replication delay.`);
        setProfile(null);
      }
    };

    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      fetchUserProfile(session?.user).finally(() => setLoading(false));
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      fetchUserProfile(session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleTriageComplete = useCallback(async (summary: string, chatHistory: { role: 'user' | 'model'; text: string }[]) => {
    if (profile && profile.role === Role.PATIENT) {
      const newTriage = {
        patient_id: profile.id,
        summary,
        chat_history: chatHistory,
      };

      const { error } = await supabase.from('triage_sessions').insert([newTriage]);
      if (error) {
        alert('Could not save triage session. Please try again.');
        console.error('Error inserting triage:', error);
      } else {
        setCurrentView(AppView.DASHBOARD);
      }
    }
  }, [profile]);
  
  const handleStartNewTriage = useCallback(() => {
    setCurrentView(AppView.TRIAGE);
  }, []);
  
  if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-xl font-semibold">Loading MediHelp AI...</div>
        </div>
      );
  }

  const renderHeader = () => (
    <header className="flex items-center justify-between mb-6 p-4 w-full">
      <div className="flex items-center space-x-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">MediHelp AI</h1>
      </div>
      {profile && (
        <div className="flex items-center space-x-4">
          <span className="text-gray-600 hidden sm:block">Welcome, <span className="font-semibold text-gray-800">{profile.name}</span> <span className="text-gray-400">({profile.role})</span></span>
          <button onClick={handleLogout} className="flex items-center space-x-2 bg-white hover:bg-gray-100 text-gray-600 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 border border-gray-200 shadow-sm">
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>
      )}
    </header>
  );

  const renderPatientView = () => {
    if (!profile) return null;

    if (currentView === AppView.TRIAGE) {
      return <ChatWindow onTriageComplete={handleTriageComplete} />;
    }
    return <PatientDashboard 
              user={profile} 
              onStartNewTriage={handleStartNewTriage} 
           />;
  };
  
  const renderViewForRole = () => {
    if (!session || !profile) {
      return <AuthScreen />;
    }
    
    switch (profile.role) {
      case Role.PATIENT:
        return renderPatientView();
      case Role.DOCTOR:
        return <DoctorDashboard doctor={profile} />;
      case Role.ADMIN:
        return <AdminDashboard admin={profile} />;
      default:
        return <AuthScreen />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-900 flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
        {renderHeader()}
        
        <main className="flex-grow bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
          {renderViewForRole()}
        </main>
        
        <footer className="w-full text-center mt-6">
          {profile?.role === Role.PATIENT && <Disclaimer />}
          <p className="text-xs text-slate-500 mt-4">
            © 2024 MediHelp. All Rights Reserved. This is a conceptual application.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
