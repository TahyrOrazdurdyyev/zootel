import React from 'react';
import BaseHero from './BaseHero';

const BusinessHero = () => {
  return (
    <BaseHero
      title="Develop your"
      subtitle="Pet Care business"
      description="Comprehensive CRM system for veterinary clinics, grooming salons, pet hotels, and other Pet Care businesses. Automate processes and increase profits."
      backgroundClass="bg-gradient-to-br from-primary-50 to-primary-100"
      subtitleColorClass="text-primary-500"
      primaryButton={{
        text: "Try for free",
        to: "/register",
        className: "btn-primary text-lg px-8 py-4"
      }}
      secondaryButton={{
        text: "Watch demo",
        className: "btn-secondary text-lg px-8 py-4"
      }}
      additionalContent={
        <p className="text-sm text-gray-500">
          14 days free trial • No obligations • Quick setup
        </p>
      }
    />
  );
};

export default BusinessHero; 