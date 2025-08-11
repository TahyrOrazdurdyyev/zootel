import React, { useState, useEffect } from 'react';
import { 
  TruckIcon, 
  BuildingStorefrontIcon, 
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const DeliverySelector = ({ 
  companyId, 
  orderTotal = 0,
  distance = 0,
  onDeliveryChange,
  selectedMethod 
}) => {
  const [deliveryMethods, setDeliveryMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculatedPrices, setCalculatedPrices] = useState({});

  useEffect(() => {
    fetchDeliveryMethods();
  }, [companyId]);

  useEffect(() => {
    if (deliveryMethods.length > 0) {
      calculatePrices();
    }
  }, [deliveryMethods, orderTotal, distance]);

  const fetchDeliveryMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/delivery/methods?company_id=${companyId}`);
      const data = await response.json();
      setDeliveryMethods(data);
      
      // Set default method
      if (data.length > 0 && !selectedMethod) {
        onDeliveryChange(data[0]);
      }
    } catch (error) {
      console.error('Error fetching delivery methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrices = async () => {
    const prices = {};
    
    for (const method of deliveryMethods) {
      try {
        const response = await fetch('/api/delivery/calculate-price', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            method_id: method.id,
            distance: distance,
            order_total: orderTotal
          })
        });
        
        const data = await response.json();
        prices[method.id] = data;
      } catch (error) {
        console.error(`Error calculating price for method ${method.id}:`, error);
      }
    }
    
    setCalculatedPrices(prices);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getMethodIcon = (methodType) => {
    switch (methodType) {
      case 'courier':
        return TruckIcon;
      case 'pickup_point':
        return MapPinIcon;
      case 'self_pickup':
        return BuildingStorefrontIcon;
      default:
        return TruckIcon;
    }
  };

  const getMethodTypeLabel = (methodType) => {
    switch (methodType) {
      case 'courier':
        return 'Courier Delivery';
      case 'pickup_point':
        return 'Pickup Point';
      case 'self_pickup':
        return 'Store Pickup';
      default:
        return 'Delivery';
    }
  };

  const handleMethodSelect = (method) => {
    const priceInfo = calculatedPrices[method.id];
    onDeliveryChange({
      ...method,
      calculated_price: priceInfo?.delivery_cost || method.base_price,
      estimated_delivery_date: priceInfo?.estimated_delivery_date
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Delivery Options</h3>
      
      <div className="space-y-3">
        {deliveryMethods.map((method) => {
          const IconComponent = getMethodIcon(method.method_type);
          const priceInfo = calculatedPrices[method.id];
          const deliveryPrice = priceInfo?.delivery_cost || method.base_price;
          const isFree = deliveryPrice === 0;
          const isSelected = selectedMethod?.id === method.id;
          
          return (
            <div
              key={method.id}
              onClick={() => handleMethodSelect(method)}
              className={`relative rounded-lg border p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <IconComponent className={`w-5 h-5 mt-1 ${
                    isSelected ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className={`text-sm font-medium ${
                        isSelected ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {method.name}
                      </h4>
                      
                      {isFree && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          FREE
                        </span>
                      )}
                    </div>
                    
                    {method.description && (
                      <p className={`text-sm mt-1 ${
                        isSelected ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        {method.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="w-3 h-3" />
                        <span>{method.estimated_delivery_days} day(s)</span>
                      </div>
                      
                      {method.method_type === 'courier' && distance > 0 && (
                        <div className="flex items-center space-x-1">
                          <MapPinIcon className="w-3 h-3" />
                          <span>{distance.toFixed(1)} km</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm font-medium ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {isFree ? 'Free' : formatPrice(deliveryPrice)}
                    </span>
                  </div>
                  
                  {method.free_delivery_threshold && orderTotal < method.free_delivery_threshold && (
                    <p className="text-xs text-gray-500 mt-1">
                      Free over {formatPrice(method.free_delivery_threshold)}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Summary */}
      {selectedMethod && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Selected delivery:</span>
            <span className="font-medium text-gray-900">{selectedMethod.name}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">Delivery cost:</span>
            <span className="font-medium text-gray-900">
              {selectedMethod.calculated_price === 0 
                ? 'Free' 
                : formatPrice(selectedMethod.calculated_price)
              }
            </span>
          </div>
          
          {selectedMethod.estimated_delivery_date && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Estimated delivery:</span>
              <span className="font-medium text-gray-900">
                {new Date(selectedMethod.estimated_delivery_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliverySelector; 