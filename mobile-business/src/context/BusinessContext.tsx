import React, { createContext, useContext, useState } from 'react';

interface Company {
  id: string;
  name: string;
  logo: string;
}

interface BusinessContextType {
  company: Company | null;
  setCompany: (company: Company) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<Company | null>(null);

  return (
    <BusinessContext.Provider value={{ company, setCompany }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}; 