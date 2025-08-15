import React from 'react';

const Disclaimer: React.FC = () => {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-r-lg max-w-3xl mx-auto" role="alert">
      <p className="font-bold">Important Notice</p>
      <p className="text-sm">
        MediHelp AI is an informational tool and not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read on this application.
      </p>
    </div>
  );
};

export default Disclaimer;