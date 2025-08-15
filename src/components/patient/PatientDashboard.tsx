import React, { useState, useEffect } from 'react';
import { Profile, TriageSession, Appointment } from '../../types';
import { CalendarIcon } from '../icons/CalendarIcon';
import { HistoryIcon } from '../icons/HistoryIcon';
import { BotIcon } from '../icons/BotIcon';
import { UserIcon } from '../icons/UserIcon';
import { supabase } from '../../services/supabaseClient';
import LoadingSpinner from '../LoadingSpinner';
import { PlusIcon } from '../icons/PlusIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';


interface PatientDashboardProps {
  user: Profile;
  onStartNewTriage: () => void;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ user, onStartNewTriage }) => {
  const [triageHistory, setTriageHistory] = useState<TriageSession[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTriageId, setExpandedTriageId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch Triage History
      const { data: triageData, error: triageError } = await supabase
        .from('triage_sessions')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (triageError) {
        console.error('Error fetching triage history:', triageError);
        setTriageHistory([]);
      } else if (triageData) {
        setTriageHistory(triageData as TriageSession[]);
      }

      // Fetch Appointments
      const { data: apptData, error: apptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true });
        
      if (apptError) {
        console.error('Error fetching appointments:', apptError);
        setAppointments([]);
      } else if (apptData) {
        setAppointments(apptData);
      }

      setLoading(false);
    };

    fetchData();
  }, [user.id]);

  const toggleTriageExpansion = (id: string) => {
    setExpandedTriageId(expandedTriageId === id ? null : id);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  return (
    <div className="p-8 bg-slate-50 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Welcome, {user.name}</h2>
          <p className="text-slate-500">Here's your personal health dashboard.</p>
        </div>
        <button 
          onClick={onStartNewTriage}
          className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <PlusIcon className="w-5 h-5"/>
          <span>Start New Triage</span>
        </button>
      </div>

      {loading ? <div className="flex justify-center items-center h-64"><LoadingSpinner/></div> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Triage History */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
              <div className="flex items-center mb-4">
                <HistoryIcon className="w-6 h-6 mr-3 text-blue-500" />
                <h3 className="text-xl font-bold text-slate-800">Triage History</h3>
              </div>
              <div className="space-y-4">
                {triageHistory.length > 0 ? triageHistory.map((triage) => (
                  <div key={triage.id} className="border border-slate-200 rounded-lg">
                    <button onClick={() => toggleTriageExpansion(triage.id)} className="w-full text-left p-4 hover:bg-slate-50 flex justify-between items-center transition-colors">
                      <div>
                        <p className="font-semibold text-slate-700">{triage.summary}</p>
                        <p className="text-sm text-slate-500">{formatDate(triage.created_at)}</p>
                      </div>
                       <ChevronDownIcon className={`h-6 w-6 text-gray-400 transition-transform duration-300 ${expandedTriageId === triage.id ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedTriageId === triage.id && (
                      <div className="p-4 border-t border-slate-200 bg-slate-50 max-h-96 overflow-y-auto">
                         <h4 className="font-semibold mb-2 text-slate-600">Conversation Details:</h4>
                         <div className="space-y-4">
                          {triage.chat_history.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                              {msg.role === 'model' && <BotIcon />}
                              <div className={`max-w-md p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-100 text-blue-900 rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                              </div>
                              {msg.role === 'user' && <UserIcon />}
                            </div>
                          ))}
                         </div>
                      </div>
                    )}
                  </div>
                )) : <p className="text-slate-500">No triage history found.</p>}
              </div>
            </div>
          </div>

          {/* Right Column - Appointments */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <div className="flex items-center mb-4">
              <CalendarIcon className="w-6 h-6 mr-3 text-blue-500" />
              <h3 className="text-xl font-bold text-slate-800">Upcoming Appointments</h3>
            </div>
            <div className="space-y-4">
              {appointments.length > 0 ? appointments.map(appt => (
                <div key={appt.id} className="p-4 bg-white rounded-lg border-2 border-blue-100 hover:border-blue-200 transition-colors">
                  <p className="font-bold text-blue-800">{appt.reason}</p>
                  <p className="text-sm text-blue-700">{formatDate(appt.appointment_date)}</p>
                  <p className={`text-xs font-semibold mt-1 inline-block px-2 py-1 rounded-full ${appt.status === 'Confirmed' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>{appt.status}</p>
                </div>
              )) : <p className="text-slate-500">No upcoming appointments.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
