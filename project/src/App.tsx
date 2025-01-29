import React, { useState, useRef, useEffect } from 'react';
import { Sliders, Send, MessageCircle, Brain, AlertCircle, Smile, WifiOff } from 'lucide-react';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
  emotionalState?: {
    anger: number;
    sadness: number;
  };
}

interface EmotionalParameters {
  valence: number;
  arousal: number;
  selectionThreshold: number;
  resolution: number;
  goalDirectedness: number;
  securingRate: number;
}

interface EmotionalState {
  anger: number;
  sadness: number;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showParameters, setShowParameters] = useState(false);
  const [emotionalState, setEmotionalState] = useState<EmotionalState>({ anger: 1, sadness: 1 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [parameters, setParameters] = useState<EmotionalParameters>({
    valence: 4.5,
    arousal: 5.0,
    selectionThreshold: 3.2,
    resolution: 4.8,
    goalDirectedness: 6.0,
    securingRate: 3.5
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    calculateEmotions();
  }, [parameters]);

  const calculateEmotions = async () => {
    try {
      setBackendError(false);
      const response = await fetch('http://127.0.0.1:5000/calculate-emotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parameters),
      });
      if (!response.ok) {
        throw new Error('Backend server error');
      }
      const data = await response.json();
      setEmotionalState(data);
    } catch (error) {
      console.error('Error calculating emotions:', error);
      setBackendError(true);
    }
  };

  const handleParameterChange = (param: keyof EmotionalParameters, value: number) => {
    setParameters(prev => ({
      ...prev,
      [param]: value
    }));
  };

  const getEmotionalStateDescription = (state: EmotionalState) => {
    const normalizedAnger = (state.anger / 7) * 5;
    const normalizedSadness = (state.sadness / 7) * 5;
    
    if (normalizedAnger > 4) return "Very Agitated";
    if (normalizedAnger > 3) return "Frustrated";
    if (normalizedSadness > 4) return "Very Sad";
    if (normalizedSadness > 3) return "Melancholic";
    if (normalizedAnger < 2 && normalizedSadness < 2) return "Calm";
    return "Neutral";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isProcessing) return;

    setIsProcessing(true);
    const newMessage: Message = {
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    try {
      setBackendError(false);
      const response = await fetch('http://127.0.0.1:5000/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          parameters: parameters
        }),
      });
      if (!response.ok) {
        throw new Error('Backend server error');
      }
      const data = await response.json();
      setMessages(prev => [...prev, {
        text: data.reply,
        isUser: false,
        timestamp: new Date(),
        emotionalState: emotionalState
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setBackendError(true);
      setMessages(prev => [...prev, {
        text: "I'm currently unable to process messages. Please ensure the backend server is running.",
        isUser: false,
        timestamp: new Date(),
        emotionalState: emotionalState
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {backendError && (
          <div className="mb-4 p-4 bg-red-900/50 rounded-lg flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-red-400" />
            <p className="text-red-200">
              Unable to connect to the backend server. Please ensure it's running at http://127.0.0.1:5000
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold">Emotional AI Assistant</h1>
              <p className="text-sm text-gray-400">Current State: {getEmotionalStateDescription(emotionalState)}</p>
            </div>
          </div>
          <button
            onClick={() => setShowParameters(!showParameters)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Sliders className="w-4 h-4" />
            Psi Parameters
          </button>
        </div>

        {showParameters && (
          <div className="bg-gray-800 p-6 rounded-lg mb-8 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <p className="text-sm text-yellow-400">
                Adjusting parameters will affect the AI's emotional responses
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(parameters).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <label className="block text-sm font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()} ({value.toFixed(1)})
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="7"
                    step="0.1"
                    value={value}
                    onChange={(e) => handleParameterChange(key as keyof EmotionalParameters, parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Smile className="w-5 h-5" />
                Emotional State (1-5 Scale)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-red-400">
                    Anger Level: {((emotionalState.anger / 7) * 5).toFixed(2)}
                  </span>
                  <div className="w-full bg-gray-600 rounded-full h-2.5">
                    <div
                      className="bg-red-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${(emotionalState.anger / 7) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <span className="text-blue-400">
                    Sadness Level: {((emotionalState.sadness / 7) * 5).toFixed(2)}
                  </span>
                  <div className="w-full bg-gray-600 rounded-full h-2.5">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${(emotionalState.sadness / 7) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg shadow-xl">
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-lg ${
                    message.isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {!message.isUser && <MessageCircle className="w-4 h-4" />}
                    <span className="font-medium">
                      {message.isUser ? 'You' : 'AI Assistant'}
                    </span>
                    <span className="text-xs opacity-50">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{message.text}</p>
                  {message.emotionalState && (
                    <div className="mt-2 text-xs text-gray-400">
                      Emotional State: {getEmotionalStateDescription(message.emotionalState)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
            <div className="flex gap-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={backendError ? "Backend server not connected..." : "Type your message..."}
                className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing || backendError}
              />
              <button
                type="submit"
                className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  isProcessing || backendError
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                disabled={isProcessing || backendError}
              >
                <Send className="w-4 h-4" />
                {isProcessing ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;