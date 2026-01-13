import { useState, useEffect, useRef } from 'react';
import { Settings, Mic, MicOff, ChevronDown, Award, BookOpen, Volume2, Check } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Task } from '../data/mockTasks';

// --- Types & Mock Data ---

type Message = {
  id: string;
  sender: 'ai' | 'user';
  text: string;
};

type Feedback = {
  fluency: number; // 0-100
  pronunciation: number; // 0-100
  vocabulary: number; // 0-100
  fluencyLabel: string;
  pronunciationLabel: string;
  vocabularyLabel: string;
};

const MOCK_USER_RESPONSES = [
  "My favorite hobby is photography. I love capturing moments in nature.",
  "I also enjoy hiking on weekends. It helps me clear my mind.",
  "Recently, I started learning to cook Italian food.",
];

const MOCK_AI_RESPONSES = [
  "That sounds wonderful! Photography is a great way to express creativity. Do you prefer digital or film?",
  "Hiking is fantastic for health. Where is your favorite trail?",
  "Italian cuisine is delicious! What is your favorite dish to make?",
];

const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  sender: 'ai',
  text: "Let’s begin! Can you tell me about your favorite hobby?",
};

// --- Helper Components ---

// Simple simulated waveform
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

// Avatar Component
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
      {/* Preload both images and toggle opacity. Images are now pre-aligned/scaled by user. */}
      <div className="relative w-full h-full z-10">
        <img 
          src="/avatar_closed.png" 
          alt="Avatar Closed" 
          className={`absolute inset-0 w-full h-full object-contain object-bottom drop-shadow-xl transition-opacity duration-100 ${isSpeaking && mouthOpen ? 'opacity-0' : 'opacity-100'}`} 
        />
        <img 
          src="/avatar_open.png" 
          alt="Avatar Open" 
          className={`absolute inset-0 w-full h-full object-contain object-bottom drop-shadow-xl transition-opacity duration-100 ${isSpeaking && mouthOpen ? 'opacity-100' : 'opacity-0'}`} 
        />
      </div>
    </div>
  );
};

// Feedback Bar
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

  // State
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isClassActive, setIsClassActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(true);

  // Voice Selection State
  const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState({ id: 'v1', name: 'Sarah (US)' });
  const voices = [
    { id: 'v1', name: 'Sarah (US)' },
    { id: 'v2', name: 'Matteo (UK)' },
    { id: 'v3', name: 'Emma (AU)' },
    { id: 'v4', name: 'Hiro (JP)' },
  ];
  
  // Refs for scroll and logic
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const turnCount = useRef(0);
  const isClassActiveRef = useRef(false); // To access fresh state in timeouts
  const messageIdRef = useRef(0);

  // Sync ref with state
  useEffect(() => {
    isClassActiveRef.current = isClassActive;
  }, [isClassActive]);

  // Initialize with task-specific message if available
  useEffect(() => {
    if (currentTask) {
       setMessages([{
         id: 'init-task',
         sender: 'ai',
         text: `Today we’ll practice talking about: ${currentTask.topic}. Let’s begin!`
       }]);
    }
  }, [currentTask]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Session Timer
  useEffect(() => {
    let timer: number | undefined;
    if (isClassActive) {
      timer = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isClassActive]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle Microphone Interaction
  const toggleClass = () => {
    if (isClassActive) {
      // Stop Class
      setIsClassActive(false);
      setIsRecording(false);
      setIsAISpeaking(false);
    } else {
      // Start Class
      setIsClassActive(true);
      startUserTurn();
    }
  };

  const startUserTurn = () => {
    if (!isClassActiveRef.current) return;
    
    setIsRecording(true);
    // Simulate User Speaking duration (3-4s)
    setTimeout(() => {
      if (!isClassActiveRef.current) return;
      setIsRecording(false);
      handleUserTurnComplete();
    }, 3500);
  };

  const handleUserTurnComplete = () => {
    if (!isClassActiveRef.current) return;

    // Add User Message
    const userText = MOCK_USER_RESPONSES[turnCount.current % MOCK_USER_RESPONSES.length];
    const newUserMsg: Message = {
      id: `user-${++messageIdRef.current}`,
      sender: 'user',
      text: userText,
    };
    setMessages(prev => [...prev, newUserMsg]);

    // Trigger AI processing/speaking
    setTimeout(() => {
      if (!isClassActiveRef.current) return;
      setIsAISpeaking(true);
      
      // AI "Thinking" delay
      setTimeout(() => {
        if (!isClassActiveRef.current) return;
        const aiText = MOCK_AI_RESPONSES[turnCount.current % MOCK_AI_RESPONSES.length];
        const newAIMsg: Message = {
          id: `ai-${++messageIdRef.current}`,
          sender: 'ai',
          text: aiText,
        };
        setMessages(prev => [...prev, newAIMsg]);
        
        // Generate Mock Feedback
        setFeedback({
          fluency: 85 + Math.random() * 10,
          pronunciation: 70 + Math.random() * 20,
          vocabulary: 90,
          fluencyLabel: 'Good',
          pronunciationLabel: Math.random() > 0.5 ? 'Good' : 'Needs Work',
          vocabularyLabel: 'Excellent',
        });

        // Stop AI Speaking after "reading" the text
        setTimeout(() => {
          if (!isClassActiveRef.current) return;
          setIsAISpeaking(false);
          turnCount.current += 1;
          
          // Loop back to user turn if class is still active
          setTimeout(() => {
            if (isClassActiveRef.current) {
              startUserTurn();
            }
          }, 500);
          
        }, 3000); 

      }, 1000); // Thinking time
    }, 500); // Slight pause after user stops
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {/* 1. Top Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">V</div>
            <span className="text-xl font-bold text-indigo-900 tracking-tight">Verba</span>
          </div>
          
          {/* My Tasks Button */}
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors"
          >
            <BookOpen size={16} />
            My Tasks
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Voice Selector (Replaces Level Selector) */}
          <div className="relative">
            <button 
              onClick={() => setIsVoiceMenuOpen(!isVoiceMenuOpen)}
              className="hidden md:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-200 transition"
            >
              <Volume2 size={16} className="text-indigo-600" />
              {selectedVoice.name}
              <ChevronDown size={14} className={`transition-transform ${isVoiceMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isVoiceMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsVoiceMenuOpen(false)}></div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 overflow-hidden">
                   {voices.map((voice) => (
                     <button
                       key={voice.id}
                       onClick={() => {
                         setSelectedVoice(voice);
                         setIsVoiceMenuOpen(false);
                       }}
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

      {/* 2. Main Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-64px)] overflow-hidden">
        
        {/* Left Column: Avatar Interaction (60%) */}
        <section className="lg:col-span-7 bg-white rounded-3xl shadow-lg border border-gray-100 flex flex-col relative overflow-hidden">
          
          {/* Session Info Overlay */}
          <div className="absolute top-6 left-6 flex items-center gap-3 z-20">
             <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-600 border border-gray-200 flex items-center gap-2 shadow-sm">
               <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
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

          {/* Avatar Area */}
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <Avatar isSpeaking={isAISpeaking} />
            
            <div className="mt-8 text-center h-8">
               {isAISpeaking ? (
                 <p className="text-indigo-600 font-medium animate-pulse">Verba is speaking...</p>
               ) : isRecording ? (
                 <p className="text-red-500 font-medium animate-pulse">Listening...</p>
               ) : (
                 <p className="text-gray-400 text-sm">Tap microphone to speak</p>
               )}
            </div>
          </div>

          {/* Controls Area */}
          <div className="pb-10 pt-4 flex flex-col items-center justify-center gap-6 bg-gradient-to-t from-white via-white to-transparent">
             {/* Waveform */}
             <div className="h-12 w-full flex justify-center">
                <Waveform active={isRecording || isAISpeaking} />
             </div>

             {/* Main Action Button (Start/Stop Class) */}
             <button
               onClick={toggleClass}
               className={`
                 relative px-8 py-4 rounded-full font-bold text-lg shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-3
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
             
             <p className="text-xs text-gray-400 font-medium mt-2">
               {isClassActive ? "Conversación en curso..." : "Presiona para iniciar la práctica"}
             </p>
          </div>
        </section>

        {/* Right Column: Chat & Feedback (40%) */}
        <section className="lg:col-span-5 flex flex-col gap-4 h-full overflow-hidden">
          
          {/* Chat Panel */}
          <div className={`bg-white rounded-3xl shadow-md border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ${isChatOpen ? 'flex-1' : 'flex-none'}`}>
            <div 
              className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
              onClick={() => setIsChatOpen(!isChatOpen)}
            >
              <h3 className="font-semibold text-gray-700">Transcript</h3>
              <div className="flex items-center gap-3">
                 <button className="text-xs text-indigo-600 hover:underline" onClick={(e) => e.stopPropagation()}>Download</button>
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
              
              {/* Typing indicator */}
              {isRecording && (
                <div className="flex justify-end">
                   <div className="bg-indigo-50 text-indigo-400 p-3 rounded-2xl rounded-br-none text-xs italic animate-pulse">
                     Listening...
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
                </div>
              )}
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}
