import React from 'react';
import { Link } from 'react-router-dom';

const BaseHero = ({
  title,
  subtitle,
  description,
  backgroundClass = 'bg-gradient-to-br from-blue-50 to-blue-100',
  textColorClass = 'text-gray-900',
  subtitleColorClass = 'text-blue-600',
  descriptionColorClass = 'text-gray-600',
  primaryButton,
  secondaryButton,
  additionalContent,
  containerClass = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  sectionClass = 'py-20',
  children
}) => {
  return (
    <section className={`${backgroundClass} ${sectionClass}`}>
      <div className={containerClass}>
        <div className="text-center">
          {/* Title */}
          <h1 className={`text-4xl md:text-6xl font-bold ${textColorClass} leading-tight`}>
            {title}
            {subtitle && (
              <>
                {' '}
                <span className={subtitleColorClass}>{subtitle}</span>
              </>
            )}
          </h1>

          {/* Description */}
          {description && (
            <p className={`mt-6 text-xl ${descriptionColorClass} max-w-3xl mx-auto`}>
              {description}
            </p>
          )}

          {/* Buttons */}
          {(primaryButton || secondaryButton) && (
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              {primaryButton && (
                <Link
                  to={primaryButton.to || '#'}
                  className={primaryButton.className || 'btn-primary text-lg px-8 py-4'}
                  onClick={primaryButton.onClick}
                >
                  {primaryButton.text}
                </Link>
              )}
              {secondaryButton && (
                <button 
                  className={secondaryButton.className || 'btn-secondary text-lg px-8 py-4'}
                  onClick={secondaryButton.onClick}
                >
                  {secondaryButton.text}
                </button>
              )}
            </div>
          )}

          {/* Additional Content */}
          {additionalContent && (
            <div className="mt-4">
              {additionalContent}
            </div>
          )}

          {/* Custom Children */}
          {children}
        </div>
      </div>
    </section>
  );
};

export default BaseHero; 