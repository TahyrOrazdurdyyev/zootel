package handlers

import (
	"net/http"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type CartHandler struct {
	cartService services.CartServiceInterface
}

func NewCartHandler(cartService services.CartServiceInterface) *CartHandler {
	return &CartHandler{cartService: cartService}
}

func (h *CartHandler) GetCart(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get cart endpoint"})
}

func (h *CartHandler) AddToCart(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Add to cart endpoint"})
}

func (h *CartHandler) UpdateCartItem(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Update cart item endpoint"})
}

func (h *CartHandler) RemoveFromCart(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Remove from cart endpoint"})
}

func (h *CartHandler) ClearCart(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Clear cart endpoint"})
}
