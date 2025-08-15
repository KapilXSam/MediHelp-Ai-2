

import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex space-x-2 justify-center items-center">
      <div className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 bg-slate-500 rounded-full animate-bounce"></div>
    </div>
  );
};

export default LoadingSpinner;