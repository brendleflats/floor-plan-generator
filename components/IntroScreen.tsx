import React from 'react';

interface IntroScreenProps {
  onStart: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-800 rounded-lg">
      <div className="max-w-2xl">
        <h2 className="text-4xl font-extrabold text-white mb-4">Design Your Space with AI</h2>
        <p className="text-lg text-gray-300 mb-8">
          Welcome to the future of interior design. Use your device's camera and microphone to describe your room, and our AI will generate a detailed floor plan for you in seconds.
        </p>
        <div className="bg-gray-900/50 border border-gray-700 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-bold text-indigo-400 mb-3">How It Works</h3>
            <ol className="text-left text-gray-300 space-y-3">
                <li className="flex items-start"><span className="bg-indigo-500 text-white rounded-full w-6 h-6 text-sm font-bold flex items-center justify-center mr-3 flex-shrink-0">1</span> Start a live session and grant camera/microphone permissions.</li>
                <li className="flex items-start"><span className="bg-indigo-500 text-white rounded-full w-6 h-6 text-sm font-bold flex items-center justify-center mr-3 flex-shrink-0">2</span> Walk around your space and describe it. Mention room names, dimensions, and the locations of doors and windows.</li>
                <li className="flex items-start"><span className="bg-indigo-500 text-white rounded-full w-6 h-6 text-sm font-bold flex items-center justify-center mr-3 flex-shrink-0">3</span> Describe any important paths, like "the emergency exit route starts here and goes to the main door."</li>
                <li className="flex items-start"><span className="bg-indigo-500 text-white rounded-full w-6 h-6 text-sm font-bold flex items-center justify-center mr-3 flex-shrink-0">4</span> When you're done, the AI will process your description and generate a floor plan with your specified routes.</li>
            </ol>
        </div>
        <button
          onClick={onStart}
          className="px-8 py-4 bg-indigo-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-transform transform hover:scale-105"
        >
          Start Designing
        </button>
      </div>
    </div>
  );
};

export default IntroScreen;