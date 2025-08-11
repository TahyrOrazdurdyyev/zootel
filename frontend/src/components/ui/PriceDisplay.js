import React from 'react';
import { TagIcon } from '@heroicons/react/24/outline';

const PriceDisplay = ({ 
  price, 
  originalPrice, 
  wholesalePrice,
  quantity = 1,
  showWholesale = false,
  size = 'medium', // small, medium, large
  showSavings = true 
}) => {
  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getDiscountPercentage = (original, current) => {
    if (!original || original <= current) return 0;
    return Math.round(((original - current) / original) * 100);
  };

  const getSavingsAmount = (original, current) => {
    if (!original || original <= current) return 0;
    return original - current;
  };

  const totalPrice = price * quantity;
  const totalOriginalPrice = originalPrice ? originalPrice * quantity : null;
  const discountPercentage = getDiscountPercentage(originalPrice, price);
  const totalSavings = getSavingsAmount(totalOriginalPrice, totalPrice);

  const sizeClasses = {
    small: {
      price: 'text-lg font-bold',
      original: 'text-sm line-through',
      discount: 'text-xs px-2 py-1',
      wholesale: 'text-xs',
      savings: 'text-xs'
    },
    medium: {
      price: 'text-xl font-bold',
      original: 'text-base line-through',
      discount: 'text-sm px-2 py-1',
      wholesale: 'text-sm',
      savings: 'text-sm'
    },
    large: {
      price: 'text-2xl font-bold',
      original: 'text-lg line-through',
      discount: 'text-base px-3 py-1',
      wholesale: 'text-base',
      savings: 'text-base'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className="space-y-2">
      {/* Main Price Display */}
      <div className="flex items-center space-x-3">
        <span className={`${classes.price} text-gray-900`}>
          {formatPrice(totalPrice)}
        </span>

        {/* Original Price (if on sale) */}
        {originalPrice && discountPercentage > 0 && (
          <span className={`${classes.original} text-gray-500`}>
            {formatPrice(totalOriginalPrice)}
          </span>
        )}

        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <span className={`${classes.discount} bg-red-100 text-red-800 font-medium rounded-full inline-flex items-center`}>
            <TagIcon className="w-3 h-3 mr-1" />
            -{discountPercentage}%
          </span>
        )}
      </div>

      {/* Quantity Display */}
      {quantity > 1 && (
        <div className="text-sm text-gray-600">
          {formatPrice(price)} each × {quantity}
        </div>
      )}

      {/* Wholesale Price */}
      {showWholesale && wholesalePrice && (
        <div className={`${classes.wholesale} text-blue-600 font-medium`}>
          Wholesale: {formatPrice(wholesalePrice * quantity)}
          {quantity > 1 && (
            <span className="text-gray-500 ml-1">
              ({formatPrice(wholesalePrice)} each)
            </span>
          )}
        </div>
      )}

      {/* Savings Amount */}
      {showSavings && totalSavings > 0 && (
        <div className={`${classes.savings} text-green-600 font-medium flex items-center`}>
          <TagIcon className="w-4 h-4 mr-1" />
          You save {formatPrice(totalSavings)}
        </div>
      )}

      {/* Price Tiers Info */}
      {quantity < 10 && (
        <div className="text-xs text-gray-500">
          Buy 10+ for better pricing
        </div>
      )}
    </div>
  );
};

export default PriceDisplay; 