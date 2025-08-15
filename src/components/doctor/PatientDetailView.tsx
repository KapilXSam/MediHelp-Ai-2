import React, { useState, useEffect, useRef } from 'react';
import { Profile, TriageSession, LiveChatMessage, Prescription } from '../../types';
import { BotIcon } from '../icons/BotIcon';
import { UserIcon } from '../icons/UserIcon';
import { HistoryIcon } from '../icons/HistoryIcon';
import { ChatIcon } from '../icons/ChatIcon';
import { PrescriptionIcon } from '../icons/PrescriptionIcon';
import { SendIcon } from '../icons/SendIcon';
import { supabase } from '../../services/supabaseClient';
import LoadingSpinner from '../LoadingSpinner';
import { ArrowLeftIcon } from '../icons/ArrowLeftIcon';
import { PlusIcon } from '../icons/PlusIcon';

type ActiveTab = 'triage' | 'chat' | 'prescriptions';

interface PatientDetailViewProps {
  doctor: Profile;
  patient: Profile;
  onBack: () => void;
}

const PatientDetailView: React.FC<PatientDetailViewProps> = ({ doctor, patient, onBack }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('triage');
  const [triageHistory, setTriageHistory] = useState<TriageSession[]>([]);
  const [liveChatMessages, setLiveChatMessages] = useState<LiveChatMessage[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [chatInput, setChatInput] = useState('');
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [newPrescription, setNewPrescription] = useState({ medication: '', dosage: '', instructions: '' });
  const [triageError, setTriageError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [prescriptionError, setPrescriptionError] = useState<string | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [liveChatMessages]);
  
  useEffect(() => {
    const fetchAllPatientData = async () => {
      setLoading(true);
      setTriageError(null);
      setChatError(null);
      setPrescriptionError(null);
      
      const [triageRes, chatRes, prescriptionRes] = await Promise.all([
        supabase.from('triage_sessions').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false }),
        supabase.from('live_chat_messages').select('*').or(`and(sender_id.eq.${doctor.id},receiver_id.eq.${patient.id}),and(sender_id.eq.${patient.id},receiver_id.eq.${doctor.id})`).order('created_at', { ascending: true }),
        supabase.from('prescriptions').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false })
      ]);
      
      if (triageRes.error) {
        console.error("Error fetching triage history:", triageRes.error.message);
        setTriageError("Could not load triage history.");
        setTriageHistory([]);
      } else {
        const triageData = (triageRes.data || []) as TriageSession[];
        setTriageHistory(triageData);
        const initialNotes = triageData.reduce((acc, triage) => {
            acc[triage.id] = triage.doctor_notes || '';
            return acc;
        }, {} as Record<string, string>);
        setNotes(initialNotes);
      }

      if (chatRes.error) {
        console.error("Error fetching chat messages:", chatRes.error.message);
        setChatError("Could not load chat messages. The database table might be missing or misconfigured.");
        setLiveChatMessages([]);
      } else {
        setLiveChatMessages(chatRes.data || []);
      }

      if (prescriptionRes.error) {
        console.error("Error fetching prescriptions:", prescriptionRes.error.message);
        setPrescriptionError("Could not load prescriptions. The database table might be missing or a column might be incorrect.");
        setPrescriptions([]);
      } else {
        setPrescriptions(prescriptionRes.data || []);
      }

      setLoading(false);
    };

    fetchAllPatientData();
  }, [patient.id, doctor.id]);

  useEffect(() => {
    const channel = supabase.channel(`live_chat:${doctor.id}:${patient.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'live_chat_messages',
      }, (payload) => {
        const newMessage = payload.new as LiveChatMessage;
        if ((newMessage.sender_id === doctor.id && newMessage.receiver_id === patient.id) ||
            (newMessage.sender_id === patient.id && newMessage.receiver_id === doctor.id)) {
          setLiveChatMessages(messages => [...messages, newMessage]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctor.id, patient.id]);

  const handleNoteChange = (triageId: string, text: string) => setNotes(prev => ({...prev, [triageId]: text}));
  
  const handleSaveNote = async (triageId: string) => {
    const { error } = await supabase.from('triage_sessions').update({ doctor_notes: notes[triageId] }).eq('id', triageId);
    if (error) alert(`Error saving note: ${error.message}`);
    else alert(`Note saved successfully!`);
  };

  const handleSendChatMessage = async () => {
    if (chatInput.trim() === '') return;
    const newMessage = {
      sender_id: doctor.id,
      receiver_id: patient.id,
      message_text: chatInput.trim()
    };
    const { error } = await supabase.from('live_chat_messages').insert([newMessage]);
    if (error) alert(`Error sending message: ${error.message}`);
    else setChatInput('');
  };

  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrescription.medication || !newPrescription.dosage) {
        alert("Medication and Dosage are required fields.");
        return;
    }
    const prescriptionData = {
      ...newPrescription,
      patient_id: patient.id,
      doctor_id: doctor.id,
    };
    const { data, error } = await supabase.from('prescriptions').insert([prescriptionData]).select();
    if (error) {
      alert(`Error saving prescription: ${error.message}`);
    } else if (data && data.length > 0) {
      setPrescriptions([data[0], ...prescriptions]);
      setShowPrescriptionForm(false);
      setNewPrescription({ medication: '', dosage: '', instructions: '' });
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const renderTriageTab = () => {
    if (triageError) return <div className="text-center py-10 text-red-600 bg-red-50 p-4 rounded-lg">{triageError}</div>;
    return triageHistory.length > 0 ? (
      <div className="space-y-6">
        {triageHistory.map(triage => (
          <div key={triage.id} className="bg-slate-50 border border-slate-200 rounded-lg p-6">
            <p className="font-bold text-slate-800">{triage.summary}</p>
            <p className="text-sm text-slate-500">{formatDate(triage.created_at)}</p>
            <div className="mt-4 bg-white p-4 rounded-md border max-h-64 overflow-y-auto space-y-3">
               {triage.chat_history.map((msg, index) => (
                  <div key={index} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'model' && <BotIcon />}
                    <div className={`max-w-lg p-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-100' : 'bg-slate-100'}`}>{msg.text}</div>
                    {msg.role === 'user' && <UserIcon />}
                  </div>
                ))}
            </div>
            <div className="mt-4">
                <h4 className="font-semibold text-slate-600 mb-2">Doctor's Notes</h4>
                <textarea value={notes[triage.id] ?? ''} onChange={(e) => handleNoteChange(triage.id, e.target.value)} rows={3} className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500" placeholder="Add notes..."/>
                <button onClick={() => handleSaveNote(triage.id)} className="mt-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow hover:shadow-md">Save Note</button>
            </div>
          </div>
        ))}
      </div>
    ) : <p className="text-slate-500 text-center py-10">No triage history available.</p>
  };

  const renderChatTab = () => {
    if (chatError) return <div className="text-center py-10 text-red-600 bg-red-50 p-4 rounded-lg">{chatError}</div>;
    return (
      <div className="flex flex-col h-[60vh] bg-white border border-slate-200 rounded-lg">
        <div className="flex-grow p-4 space-y-4 overflow-y-auto">
          {liveChatMessages.map(msg => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.sender_id === doctor.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md p-3 rounded-2xl ${msg.sender_id === doctor.id ? 'bg-blue-500 text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}>
                <p className="text-sm">{msg.message_text}</p>
                <p className={`text-xs mt-1 ${msg.sender_id === doctor.id ? 'text-blue-200' : 'text-slate-500'}`}>{formatDate(msg.created_at)}</p>
              </div>
            </div>
          ))}
          <div ref={chatMessagesEndRef} />
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center bg-white rounded-lg p-2 ring-1 ring-slate-300 focus-within:ring-2 focus-within:ring-blue-500">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()} placeholder="Type your message..." className="w-full bg-transparent focus:outline-none px-2"/>
            <button onClick={handleSendChatMessage} disabled={!chatInput.trim()} className="p-2 rounded-md bg-blue-500 text-white disabled:bg-slate-300 hover:bg-blue-600"><SendIcon /></button>
          </div>
        </div>
      </div>
    );
  };

  const renderPrescriptionsTab = () => {
    if (prescriptionError) return <div className="text-center py-10 text-red-600 bg-red-50 p-4 rounded-lg">{prescriptionError}</div>;
    return (
      <div>
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowPrescriptionForm(!showPrescriptionForm)} className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 shadow hover:shadow-md transform hover:-translate-y-px">
            <PlusIcon className="w-5 h-5"/>
            <span>{showPrescriptionForm ? 'Cancel' : 'Add Prescription'}</span>
          </button>
        </div>
        {showPrescriptionForm && (
          <form onSubmit={handleSavePrescription} className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6 space-y-4">
              <h4 className="text-lg font-semibold text-slate-700">New Prescription</h4>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Medication</label>
                <input type="text" value={newPrescription.medication} onChange={e => setNewPrescription({...newPrescription, medication: e.target.value})} className="w-full p-2 border border-slate-300 rounded-md" required/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Dosage</label>
                <input type="text" value={newPrescription.dosage} onChange={e => setNewPrescription({...newPrescription, dosage: e.target.value})} className="w-full p-2 border border-slate-300 rounded-md" required/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Instructions</label>
                <textarea value={newPrescription.instructions} onChange={e => setNewPrescription({...newPrescription, instructions: e.target.value})} rows={3} className="w-full p-2 border border-slate-300 rounded-md"></textarea>
              </div>
              <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg">Save Prescription</button>
          </form>
        )}
        <div className="space-y-4">
          {prescriptions.length > 0 ? prescriptions.map(p => (
              <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start space-x-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 bg-blue-100 text-blue-600 rounded-full p-3">
                    <PrescriptionIcon className="w-5 h-5"/>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{p.medication} - <span className="font-medium text-gray-600">{p.dosage}</span></p>
                    <p className="text-sm text-gray-600 mt-1">{p.instructions}</p>
                    <p className="text-xs text-gray-400 mt-2">Prescribed on {formatDate(p.created_at)}</p>
                  </div>
              </div>
          )) : <p className="text-slate-500 text-center py-10">No prescriptions on file for this patient.</p>}
        </div>
      </div>
    );
  };

  const TabButton: React.FC<{tab: ActiveTab; label: string; icon: React.ReactNode}> = ({tab, label, icon}) => (
    <button onClick={() => setActiveTab(tab)} className={`flex items-center space-x-2 py-3 px-4 rounded-t-lg border-b-2 font-semibold transition-colors duration-200 ${activeTab === tab ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-blue-500 hover:bg-gray-100'}`}>
        {icon}{" "}<span>{label}</span>
    </button>
  );

  return (
    <div className="p-8 h-full overflow-y-auto bg-white">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeftIcon className="h-6 w-6 text-gray-500" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{patient.name}</h2>
          <p className="text-slate-500">{patient.details}</p>
        </div>
      </div>
      
      <div className="border-b border-slate-200 mb-6">
          <nav className="flex space-x-2">
              <TabButton tab="triage" label="Triage History" icon={<HistoryIcon className="w-5 h-5"/>}/>
              <TabButton tab="chat" label="Live Chat" icon={<ChatIcon className="w-5 h-5"/>}/>
              <TabButton tab="prescriptions" label="Prescriptions" icon={<PrescriptionIcon className="w-5 h-5"/>}/>
          </nav>
      </div>
      
      {loading ? <div className="flex justify-center items-center h-64"><LoadingSpinner/></div> : (
        <div>
            {activeTab === 'triage' && renderTriageTab()}
            {activeTab === 'chat' && renderChatTab()}
            {activeTab === 'prescriptions' && renderPrescriptionsTab()}
        </div>
      )}
    </div>
  );
};

export default PatientDetailView;
