import React, { useState } from 'react';
import UniversalHeader from '../common/UniversalHeader';
import Footer from '../common/Footer';
import ChatWidget from '../ui/ChatWidget';

const PetOwnerLayout = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  return (
    <div className="theme-pet-owner min-h-screen bg-gray-50">
      <UniversalHeader />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      
      {/* Chat Widget */}
      <ChatWidget
        companyId="demo-company-id"
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
        position="bottom-right"
        aiEnabled={true}
      />
    </div>
  );
};

export default PetOwnerLayout; 