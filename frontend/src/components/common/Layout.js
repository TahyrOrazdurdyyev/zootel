import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import ChatWidget from '../ui/ChatWidget';

const Layout = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow">
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

export default Layout; 