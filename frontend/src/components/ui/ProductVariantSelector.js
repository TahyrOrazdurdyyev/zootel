import React, { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const ProductVariantSelector = ({ 
  product, 
  onVariantChange, 
  selectedVariant,
  showPricing = true 
}) => {
  const [variants, setVariants] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [availableVariants, setAvailableVariants] = useState([]);

  useEffect(() => {
    if (product?.id) {
      fetchProductVariants();
      fetchProductAttributes();
    }
  }, [product?.id]);

  useEffect(() => {
    if (variants.length > 0 && attributes.length > 0) {
      filterAvailableVariants();
    }
  }, [selectedAttributes, variants, attributes]);

  const fetchProductVariants = async () => {
    try {
      const response = await fetch(`/api/products/${product.id}/variants`);
      const data = await response.json();
      setVariants(data);
      
      // Set default variant
      const defaultVariant = data.find(v => v.is_default) || data[0];
      if (defaultVariant && !selectedVariant) {
        onVariantChange(defaultVariant);
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
    }
  };

  const fetchProductAttributes = async () => {
    try {
      const response = await fetch('/api/products/attributes');
      const data = await response.json();
      setAttributes(data);
    } catch (error) {
      console.error('Error fetching attributes:', error);
    }
  };

  const filterAvailableVariants = () => {
    const filtered = variants.filter(variant => {
      const variantAttrs = JSON.parse(variant.attributes || '{}');
      return Object.entries(selectedAttributes).every(([key, value]) => {
        return !value || variantAttrs[key] === value;
      });
    });
    setAvailableVariants(filtered);
  };

  const handleAttributeChange = (attributeName, value) => {
    const newAttributes = { ...selectedAttributes, [attributeName]: value };
    setSelectedAttributes(newAttributes);

    // Find exact matching variant
    const matchingVariant = variants.find(variant => {
      const variantAttrs = JSON.parse(variant.attributes || '{}');
      return Object.entries(newAttributes).every(([key, val]) => {
        return !val || variantAttrs[key] === val;
      });
    });

    if (matchingVariant) {
      onVariantChange(matchingVariant);
    }
  };

  const getAttributeValues = (attributeId) => {
    return attributes.find(attr => attr.id === attributeId)?.values || [];
  };

  const getVariantPrice = (variant) => {
    if (!variant) return product?.price || 0;
    return variant.price;
  };

  const getVariantStock = (variant) => {
    if (!variant) return product?.stock || 0;
    return variant.stock;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getDiscountPercentage = (originalPrice, salePrice) => {
    if (!originalPrice || originalPrice <= salePrice) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  };

  if (!product || variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Attribute Selectors */}
      {attributes.map(attribute => {
        const relevantVariants = variants.filter(variant => {
          const attrs = JSON.parse(variant.attributes || '{}');
          return attrs[attribute.name];
        });

        if (relevantVariants.length === 0) return null;

        const uniqueValues = [...new Set(
          relevantVariants.map(variant => {
            const attrs = JSON.parse(variant.attributes || '{}');
            return attrs[attribute.name];
          }).filter(Boolean)
        )];

        return (
          <div key={attribute.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {attribute.display_name}
            </label>
            
            {attribute.attribute_type === 'select' && (
              <div className="relative">
                <select
                  value={selectedAttributes[attribute.name] || ''}
                  onChange={(e) => handleAttributeChange(attribute.name, e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">Select {attribute.display_name}</option>
                  {uniqueValues.map(value => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            )}

            {attribute.attribute_type === 'color' && (
              <div className="flex flex-wrap gap-2">
                {uniqueValues.map(value => (
                  <button
                    key={value}
                    onClick={() => handleAttributeChange(attribute.name, value)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      selectedAttributes[attribute.name] === value
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: value.toLowerCase() }}
                    title={value}
                  />
                ))}
              </div>
            )}

            {attribute.attribute_type === 'size' && (
              <div className="flex flex-wrap gap-2">
                {uniqueValues.map(value => (
                  <button
                    key={value}
                    onClick={() => handleAttributeChange(attribute.name, value)}
                    className={`px-4 py-2 text-sm font-medium rounded-md border ${
                      selectedAttributes[attribute.name] === value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {value.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Selected Variant Info */}
      {selectedVariant && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Selected: {selectedVariant.variant_name}
            </span>
            <span className="text-sm text-gray-500">
              SKU: {selectedVariant.sku}
            </span>
          </div>

          {showPricing && (
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(getVariantPrice(selectedVariant))}
              </span>
              
              {selectedVariant.wholesale_price && (
                <span className="text-sm text-gray-500">
                  Wholesale: {formatPrice(selectedVariant.wholesale_price)}
                </span>
              )}

              {product.original_price && getDiscountPercentage(product.original_price, getVariantPrice(selectedVariant)) > 0 && (
                <>
                  <span className="text-sm line-through text-gray-500">
                    {formatPrice(product.original_price)}
                  </span>
                  <span className="text-sm font-medium text-red-600">
                    -{getDiscountPercentage(product.original_price, getVariantPrice(selectedVariant))}%
                  </span>
                </>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className={`font-medium ${
              getVariantStock(selectedVariant) > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {getVariantStock(selectedVariant) > 0 
                ? `${getVariantStock(selectedVariant)} in stock`
                : 'Out of stock'
              }
            </span>
            
            {getVariantStock(selectedVariant) <= selectedVariant.low_stock_alert && getVariantStock(selectedVariant) > 0 && (
              <span className="text-amber-600 font-medium">
                Low stock
              </span>
            )}
          </div>
        </div>
      )}

      {/* Variant Images */}
      {selectedVariant?.image_gallery?.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Images</span>
          <div className="flex space-x-2 overflow-x-auto">
            {selectedVariant.image_gallery.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${selectedVariant.variant_name} ${index + 1}`}
                className="w-16 h-16 object-cover rounded-md border border-gray-200 flex-shrink-0"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariantSelector; 