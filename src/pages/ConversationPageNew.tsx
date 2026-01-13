import { useEffect, useRef, useState } from 'react';
import { Settings, Mic, MicOff, ChevronDown, Award, BookOpen, Volume2, Check, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Task } from '../data/mockTasks';
import { useVoiceConversation } from '../hooks/useVoiceConversation';

// --- Types ---

type Feedback = {
  fluency: number;
  pronunciation: number;
  vocabulary: number;
  fluencyLabel: string;
  pronunciationLabel: string;
  vocabularyLabel: string;
};

// --- Helper Components ---

const Waveform = ({ active }: { active: boolean }) => {
  return (
    <div className={`flex items-center justify-center space-x-1 h-12 ${active ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-1.5 bg-indigo-500 rounded-full transition-all duration-150 ${active ? 'animate-pulse' : ''}`}
          style={{
            height: active ? `${12 + i * 3}px` : '4px',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
};

const Avatar = ({ isSpeaking }: { isSpeaking: boolean }) => {
  const [mouthOpen, setMouthOpen] = useState(false);
  useEffect(() => {
    let interval: number | undefined;
    if (isSpeaking) {
      interval = window.setInterval(() => {
        setMouthOpen(prev => !prev);
      }, 200);
    } else {
      setMouthOpen(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSpeaking]);
  return (
    <div className="relative w-56 h-56 md:w-72 md:h-72 flex flex-col items-center justify-center">
      <div className={`absolute inset-0 bg-indigo-100 rounded-full blur-2xl transition-all duration-500 ${isSpeaking ? 'scale-110 opacity-70' : 'scale-100 opacity-40'}`}></div>
      {/* Preload both images and toggle opacity. Using absolute positioning with transform to center horizontally regardless of image width differences */}
      <div className="relative w-full h-full z-10">
        <img 
          src="/avatar-boca-cerrada.png" 
          alt="Avatar Closed" 
          className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-full w-auto max-w-none drop-shadow-xl transition-opacity duration-100 ${isSpeaking && mouthOpen ? 'opacity-0' : 'opacity-100'}`} 
        />
        <img 
          src="/avatar-boca-abierta.png" 
          alt="Avatar Open" 
          className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-full w-auto max-w-none drop-shadow-xl transition-opacity duration-100 ${isSpeaking && mouthOpen ? 'opacity-100' : 'opacity-0'}`} 
        />
      </div>
    </div>
  );
};

const FeedbackBar = ({ label, value, tag, colorClass }: { label: string, value: number, tag: string, colorClass: string }) => (
  <div className="mb-3">
    <div className="flex justify-between text-sm mb-1">
      <span className="font-medium text-gray-700">{label}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorClass.replace('bg-', 'bg-opacity-20 text-')}`}>{tag}</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full ${colorClass} transition-all duration-1000 ease-out`}
        style={{ width: `${value}%` }}
      ></div>
    </div>
  </div>
);

// --- Main Component ---

export default function ConversationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentTask = location.state?.task as Task | undefined;

  // Use the voice conversation hook
  const {
    state: conversationState,
    messages,
    error: connectionError,
    isConnected,
    startConversation,
    stopConversation,
    setVoice,
  } = useVoiceConversation();

  // UI State
  const [sessionTime, setSessionTime] = useState(0);
  const [feedback] = useState<Feedback | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(true);
  const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState({ id: 'v1', name: 'Ashley (US)' });
  const [logoError, setLogoError] = useState(false);

  const voices = [
    { id: 'v1', name: 'Ashley (US)' },
    { id: 'v2', name: 'Matteo (UK)' },
    { id: 'v3', name: 'Emma (AU)' },
    { id: 'v4', name: 'Hiro (JP)' },
  ];

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const sessionStartRef = useRef<number | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Session Timer
  useEffect(() => {
    let timer: number | undefined;
    if (conversationState !== 'disconnected' && conversationState !== 'error') {
      if (!sessionStartRef.current) {
        sessionStartRef.current = Date.now();
      }
      timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - (sessionStartRef.current || 0)) / 1000);
        setSessionTime(elapsed);
      }, 1000);
    } else {
      sessionStartRef.current = null;
    }
    return () => clearInterval(timer);
  }, [conversationState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleConversation = async () => {
    if (conversationState === 'disconnected' || conversationState === 'error') {
      await startConversation();
    } else {
      stopConversation();
      setSessionTime(0);
    }
  };

  const handleVoiceChange = async (voice: { id: string; name: string }) => {
    setSelectedVoice(voice);
    setIsVoiceMenuOpen(false);
    await setVoice(voice.id);
  };

  const isClassActive = conversationState !== 'disconnected' && conversationState !== 'error';
  const isAISpeaking = conversationState === 'speaking';
  const isListening = conversationState === 'listening';

  // Get status message
  const getStatusMessage = () => {
    switch (conversationState) {
      case 'connecting':
        return 'Conectando...';
      case 'listening':
        return 'Escuchando...';
      case 'processing':
        return 'Procesando...';
      case 'speaking':
        return 'Verba está hablando...';
      case 'error':
        return 'Error de conexión';
      case 'disconnected':
        return 'Presiona para iniciar la práctica';
      default:
        return '';
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex flex-col font-sans text-gray-900">

      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {logoError ? (
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">EC</div>
            ) : (
              <img
                src="/perfil.jpg"
                alt="English Connection"
                className="w-14 h-14 rounded-lg object-contain bg-white"
                onError={() => setLogoError(true)}
              />
            )}
            <span className="text-xl font-bold text-indigo-900 tracking-tight">English Connection</span>
          </div>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors"
          >
            <BookOpen size={16} />
            My Tasks
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi size={16} className="text-green-500" />
                <span className="text-green-600 font-medium">Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={16} className="text-gray-400" />
                <span className="text-gray-400">Disconnected</span>
              </>
            )}
          </div>

          {/* Voice Selector */}
          <div className="relative">
            <button
              onClick={() => setIsVoiceMenuOpen(!isVoiceMenuOpen)}
              className="hidden md:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-200 transition"
            >
              <Volume2 size={16} className="text-indigo-600" />
              {selectedVoice.name}
              <ChevronDown size={14} className={`transition-transform ${isVoiceMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isVoiceMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsVoiceMenuOpen(false)}></div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 overflow-hidden">
                   {voices.map((voice) => (
                     <button
                       key={voice.id}
                       onClick={() => handleVoiceChange(voice)}
                       className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between group"
                     >
                       <span className={`${selectedVoice.id === voice.id ? 'font-bold text-indigo-700' : 'text-gray-700'}`}>
                         {voice.name}
                       </span>
                       {selectedVoice.id === voice.id && <Check size={14} className="text-indigo-600" />}
                     </button>
                   ))}
                </div>
              </>
            )}
          </div>

          <button className="p-2 text-gray-500 hover:text-indigo-600 transition rounded-full hover:bg-gray-100">
            <Settings size={20} />
          </button>
          <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold border border-indigo-200">
            JD
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-64px)] overflow-hidden">

        {/* Left Column: Avatar Interaction */}
        <section className="lg:col-span-7 bg-white rounded-3xl shadow-lg border border-gray-100 flex flex-col relative overflow-hidden">

          {/* Session Info Overlay */}
          <div className="absolute top-6 left-6 flex items-center gap-3 z-20">
             <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-600 border border-gray-200 flex items-center gap-2 shadow-sm">
               <span className={`w-2 h-2 rounded-full ${isClassActive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></span>
               {formatTime(sessionTime)}
             </div>
             {currentTask ? (
                <div className="bg-indigo-600 px-3 py-1 rounded-full text-sm font-bold text-white border border-indigo-500 shadow-sm flex items-center gap-2">
                   <BookOpen size={14} />
                   {currentTask.topic}
                </div>
             ) : (
                <div className="bg-indigo-50 px-3 py-1 rounded-full text-sm font-bold text-indigo-700 border border-indigo-100">
                   Conversation Mode
                </div>
             )}
          </div>

          {/* Error Alert */}
          {connectionError && (
            <div className="absolute top-20 left-6 right-6 z-20">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Connection Error</p>
                  <p className="text-xs text-red-600 mt-1">{connectionError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Avatar Area */}
          <div className="flex-1 flex flex-col items-center justify-center relative pt-6 md:pt-8">
            <Avatar isSpeaking={isAISpeaking} />

            <div className="mt-8 text-center h-8">
               {isAISpeaking ? (
                 <p className="text-indigo-600 font-medium animate-pulse">English Connection is speaking...</p>
               ) : isListening ? (
                 <p className="text-red-500 font-medium animate-pulse">Listening...</p>
               ) : conversationState === 'processing' ? (
                 <p className="text-yellow-600 font-medium animate-pulse">Processing...</p>
               ) : conversationState === 'connecting' ? (
                 <p className="text-blue-600 font-medium animate-pulse">Connecting...</p>
               ) : (
                 <p className="text-gray-400 text-sm">Tap microphone to speak</p>
               )}
            </div>
          </div>

          {/* Controls Area */}
          <div className="pb-6  flex flex-col items-center justify-center gap-4 bg-gradient-to-t from-white via-white to-transparent">
             <div className="h-8 w-full flex justify-center">
                <Waveform active={isListening || isAISpeaking} />
             </div>

             <button
               onClick={toggleConversation}
               disabled={conversationState === 'connecting'}
               className={`
                 relative px-8 py-4 rounded-full font-bold text-lg shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed
                 ${isClassActive
                   ? 'bg-red-500 text-white ring-4 ring-red-100'
                   : 'bg-indigo-600 text-white hover:bg-indigo-700 ring-4 ring-indigo-50'
                 }
               `}
             >
               {isClassActive ? (
                  <>
                    <MicOff size={24} />
                    Terminar Clase
                  </>
               ) : (
                  <>
                    <Mic size={24} />
                    Empezar Clase
                  </>
               )}
             </button>

             <p className="text-xs text-gray-400 font-medium mb-2">
               {getStatusMessage()}
             </p>
          </div>
        </section>

        {/* Right Column: Chat & Feedback */}
        <section className="lg:col-span-5 flex flex-col gap-4 h-full overflow-hidden">

          {/* Chat Panel */}
          <div className={`bg-white rounded-3xl shadow-md border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ${isChatOpen ? 'flex-1' : 'flex-none'}`}>
            <div
              className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
              onClick={() => setIsChatOpen(!isChatOpen)}
            >
              <h3 className="font-semibold text-gray-700">Transcript</h3>
              <div className="flex items-center gap-3">
                 <span className="text-xs text-gray-500">{messages.length} messages</span>
                 <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${isChatOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>

            <div
              ref={chatContainerRef}
              className={`overflow-y-auto p-4 space-y-4 scroll-smooth transition-all duration-300 ${isChatOpen ? 'flex-1 opacity-100' : 'h-0 opacity-0 p-0'}`}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm
                      ${msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }
                    `}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isListening && (
                <div className="flex justify-end">
                   <div className="bg-indigo-50 text-indigo-400 p-3 rounded-2xl rounded-br-none text-xs italic animate-pulse">
                     Listening...
                   </div>
                </div>
              )}

              {conversationState === 'processing' && (
                <div className="flex justify-start">
                   <div className="bg-gray-100 text-gray-400 p-3 rounded-2xl rounded-bl-none text-xs italic animate-pulse">
                     Thinking...
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* Feedback Panel */}
          <div className={`bg-white rounded-3xl shadow-md border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ${isFeedbackOpen ? (isChatOpen ? 'h-1/3 min-h-[200px]' : 'flex-1') : 'flex-none'}`}>
            <div
              className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
              onClick={() => setIsFeedbackOpen(!isFeedbackOpen)}
            >
              <div className="flex items-center gap-2">
                <Award className="text-yellow-500" size={20} />
                <h3 className="font-bold text-gray-800">Live Feedback</h3>
              </div>
              <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${isFeedbackOpen ? 'rotate-180' : ''}`} />
            </div>

            <div className={`p-5 flex flex-col transition-all duration-300 ${isFeedbackOpen ? 'flex-1 opacity-100' : 'h-0 opacity-0 p-0'}`}>
              {feedback ? (
                <div className="flex-1 flex flex-col justify-center">
                  <FeedbackBar
                    label="Fluency"
                    value={feedback.fluency}
                    tag={feedback.fluencyLabel}
                    colorClass="bg-green-500"
                  />
                  <FeedbackBar
                    label="Pronunciation"
                    value={feedback.pronunciation}
                    tag={feedback.pronunciationLabel}
                    colorClass="bg-yellow-500"
                  />
                  <FeedbackBar
                    label="Vocabulary"
                    value={feedback.vocabulary}
                    tag={feedback.vocabularyLabel}
                    colorClass="bg-blue-500"
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center">
                  <p className="text-sm">Speak to receive instant analysis on your pronunciation and grammar.</p>
                  <p className="text-xs mt-2 text-gray-300">Coming soon!</p>
                </div>
              )}
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}
