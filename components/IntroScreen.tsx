import React from 'react';

interface IntroScreenProps {
  onStart: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 md:p-8 bg-gray-800 rounded-lg">
      <div className="max-w-5xl w-full">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Design Your Space with AI</h2>
        <p className="text-md md:text-lg text-gray-300 mb-8 max-w-3xl mx-auto">
          Welcome to the future of interior design. Use our AI to generate a detailed floor plan from a live description of your space.
        </p>

        <div className="flex flex-col md:flex-row gap-8 items-stretch mt-8">

          {/* Example Floor Plan */}
          <div className="flex-1 w-full flex flex-col items-center p-6 bg-gray-900/50 border border-gray-700 rounded-lg">
            <h3 className="text-xl font-bold text-indigo-400 mb-4">Get a Result Like This</h3>
            <div className="w-full aspect-video bg-white rounded-md p-2 shadow-inner">
              <svg viewBox="0 0 200 120" className="w-full h-full">
                <defs>
                   <marker id="intro-arrow" markerWidth="5" markerHeight="3.5" refX="0" refY="1.75" orient="auto">
                       <polygon points="0 0, 5 1.75, 0 3.5" className="fill-red-600" />
                   </marker>
                </defs>
                {/* Rooms */}
                <rect x="10" y="10" width="80" height="100" className="fill-indigo-200/50 stroke-indigo-800" strokeWidth="1" />
                <text x="50" y="65" textAnchor="middle" className="text-[10px] font-sans font-semibold fill-indigo-900">Living Room</text>
                
                <rect x="90" y="40" width="100" height="70" className="fill-indigo-200/50 stroke-indigo-800" strokeWidth="1" />
                <text x="140" y="80" textAnchor="middle" className="text-[10px] font-sans font-semibold fill-indigo-900">Kitchen</text>

                {/* Path */}
                <polyline
                  points="20,20 120,20 120,50 180,50"
                  stroke="#dc2626"
                  strokeWidth="1.5"
                  fill="none"
                  strokeDasharray="4 2"
                  markerEnd="url(#intro-arrow)"
                />
              </svg>
            </div>
             <p className="text-xs text-gray-400 mt-2">A visual plan with rooms and paths.</p>
          </div>

          {/* How It Works */}
          <div className="flex-1 w-full bg-gray-900/50 border border-gray-700 p-6 rounded-lg flex flex-col">
            <h3 className="text-xl font-bold text-indigo-400 mb-3">How It Works</h3>
            <ol className="text-left text-gray-300 space-y-3 text-sm md:text-base flex-grow">
                <li className="flex items-start"><span className="bg-indigo-500 text-white rounded-full w-6 h-6 text-sm font-bold flex items-center justify-center mr-3 flex-shrink-0">1</span> Start a live session and grant camera/microphone permissions.</li>
                <li className="flex items-start"><span className="bg-indigo-500 text-white rounded-full w-6 h-6 text-sm font-bold flex items-center justify-center mr-3 flex-shrink-0">2</span> Walk around and describe your space, dimensions, doors, and windows.</li>
                <li className="flex items-start"><span className="bg-indigo-500 text-white rounded-full w-6 h-6 text-sm font-bold flex items-center justify-center mr-3 flex-shrink-0">3</span> Point out industrial features like bay doors, stairs, and large equipment.</li>
                <li className="flex items-start"><span className="bg-indigo-500 text-white rounded-full w-6 h-6 text-sm font-bold flex items-center justify-center mr-3 flex-shrink-0">4</span> Describe important paths, like an emergency exit route.</li>
                <li className="flex items-start"><span className="bg-indigo-500 text-white rounded-full w-6 h-6 text-sm font-bold flex items-center justify-center mr-3 flex-shrink-0">5</span> When done, the AI will generate your floor plan to view and edit.</li>
            </ol>
          </div>
        </div>

        <button
          onClick={onStart}
          className="mt-10 px-8 py-4 bg-indigo-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-transform transform hover:scale-105"
        >
          Start Designing
        </button>
      </div>
    </div>
  );
};

export default IntroScreen;