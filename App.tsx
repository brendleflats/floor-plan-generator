
import React, { useState, useCallback } from 'react';
import { generateFloorPlanFromTranscript } from './services/geminiService';
import type { FloorPlan } from './types';
import IntroScreen from './components/IntroScreen';
import LiveCapture from './components/LiveCapture';
import ResultScreen from './components/ResultScreen';
import { LoadingIcon } from './components/Icons';

type AppState = 'intro' | 'live' | 'generating' | 'result' | 'error';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('intro');
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStart = () => {
    setAppState('live');
  };

  const handleRestart = () => {
    setFloorPlan(null);
    setError(null);
    setAppState('intro');
  };

  const handleFinishCapture = useCallback(async (transcript: string) => {
    setAppState('generating');
    setError(null);
    try {
      const plan = await generateFloorPlanFromTranscript(transcript);
      if (plan) {
        setFloorPlan(plan);
        setAppState('result');
      } else {
        throw new Error('The AI could not generate a floor plan from the description.');
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to generate floor plan. ${errorMessage}. Please try again.`);
      setAppState('error');
    }
  }, []);

  const renderContent = () => {
    switch (appState) {
      case 'intro':
        return <IntroScreen onStart={handleStart} />;
      case 'live':
        return <LiveCapture onFinish={handleFinishCapture} />;
      case 'generating':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <LoadingIcon className="w-16 h-16 animate-spin text-indigo-400 mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Generating Your Floor Plan...</h2>
            <p className="text-gray-400 max-w-md">Our AI architect is analyzing your description and drafting the blueprint. This may take a moment.</p>
          </div>
        );
      case 'result':
        return floorPlan && <ResultScreen floorPlan={floorPlan} onRestart={handleRestart} />;
      case 'error':
        return (
           <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-red-900/20 rounded-lg">
            <h2 className="text-2xl font-bold text-red-400 mb-4">An Error Occurred</h2>
            <p className="text-gray-300 max-w-md mb-6">{error}</p>
            <button
              onClick={handleRestart}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors"
            >
              Start Over
            </button>
          </div>
        );
      default:
        return <IntroScreen onStart={handleStart} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl h-[80vh] min-h-[600px] bg-gray-800 shadow-2xl rounded-2xl border border-gray-700 flex flex-col">
        <header className="p-4 border-b border-gray-700 text-center">
            <h1 className="text-2xl font-bold tracking-wider text-white">AI Floor Plan Generator</h1>
        </header>
        <main className="flex-grow p-4 md:p-6 overflow-y-auto">
            {renderContent()}
        </main>
      </div>
       <footer className="text-center p-4 text-gray-500 text-sm">
        Powered by Google Gemini
      </footer>
    </div>
  );
};

export default App;
