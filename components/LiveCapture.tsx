
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { MicIcon, CameraIcon } from './Icons';

interface LiveCaptureProps {
  onFinish: (transcript: string) => void;
}

const LiveCapture: React.FC<LiveCaptureProps> = ({ onFinish }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const currentInputTranscriptionRef = useRef('');

  const stopCapture = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        session.close();
      }).catch(console.error);
      sessionPromiseRef.current = null;
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  }, []);

  const startCapture = useCallback(async () => {
    if (!process.env.API_KEY) {
      setError("API_KEY environment variable not set");
      return;
    }
    setError(null);
    setTranscription([]);
    currentInputTranscriptionRef.current = '';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCapturing(true);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            const source = audioContext.createMediaStreamSource(stream);
            const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                    int16[i] = inputData[i] * 32768;
                }
                
                let binary = '';
                const len = int16.buffer.byteLength;
                const bytes = new Uint8Array(int16.buffer);
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const pcmBlob = { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };

                sessionPromiseRef.current?.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentInputTranscriptionRef.current += text;
            }
             if (message.serverContent?.turnComplete) {
                setTranscription(prev => [...prev, currentInputTranscriptionRef.current]);
                currentInputTranscriptionRef.current = '';
             }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Live session error:', e);
            setError('A connection error occurred with the AI service.');
            stopCapture();
          },
          onclose: (e: CloseEvent) => {
            console.log('Live session closed.');
            stopCapture();
          },
        },
      });
    } catch (err) {
      console.error('Error starting capture:', err);
      setError('Could not access camera or microphone. Please check permissions and try again.');
      setIsCapturing(false);
    }
  }, [stopCapture]);
  
  useEffect(() => {
    startCapture();
    return () => {
      stopCapture();
    };
  }, [startCapture, stopCapture]);

  const handleFinish = () => {
    const finalTranscript = transcription.join(' ') + ' ' + currentInputTranscriptionRef.current;
    stopCapture();
    onFinish(finalTranscript.trim());
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-grow bg-black rounded-lg overflow-hidden mb-4 border border-gray-700">
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
        {!isCapturing && !error && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <p className="text-xl text-white">Initializing live session...</p>
            </div>
        )}
         {isCapturing && (
          <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 text-sm font-bold rounded-full flex items-center animate-pulse">
            <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
            LIVE
          </div>
        )}
      </div>

      <div className="flex-shrink-0 h-32 bg-gray-900/50 border border-gray-700 rounded-lg p-4 overflow-y-auto mb-4">
        <h3 className="text-lg font-semibold text-indigo-400 mb-2">Live Transcription</h3>
        {transcription.length === 0 && <p className="text-gray-400 italic">Start speaking to see your words here...</p>}
        <p className="text-gray-200 whitespace-pre-wrap">{transcription.join(' ')}</p>
      </div>

      {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md mb-4 text-center">{error}</div>}

      <div className="flex-shrink-0 text-center">
        <button 
          onClick={handleFinish}
          disabled={!isCapturing || transcription.length === 0}
          className="px-8 py-4 bg-green-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-colors"
        >
          Finish & Generate Plan
        </button>
      </div>
    </div>
  );
};

export default LiveCapture;
