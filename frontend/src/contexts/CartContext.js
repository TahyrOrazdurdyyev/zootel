import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('zootel-cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('zootel-cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => 
        item.id === product.id && item.type === product.type
      );

      if (existingItem) {
        return currentItems.map(item =>
          item.id === product.id && item.type === product.type
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...currentItems, { 
        ...product, 
        quantity,
        addedAt: new Date().toISOString()
      }];
    });
  };

  const removeItem = (itemId, itemType) => {
    setItems(currentItems => 
      currentItems.filter(item => 
        !(item.id === itemId && item.type === itemType)
      )
    );
  };

  const updateQuantity = (itemId, itemType, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId, itemType);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.id === itemId && item.type === itemType
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const value = {
    items,
    isOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    openCart,
    closeCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 