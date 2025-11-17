package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type EmployeeHandler struct {
	employeeService *services.EmployeeService
}

func NewEmployeeHandler(employeeService *services.EmployeeService) *EmployeeHandler {
	return &EmployeeHandler{employeeService: employeeService}
}

// Employee Authentication

// LoginEmployee handles employee login
func (h *EmployeeHandler) LoginEmployee(c *gin.Context) {
	var req models.EmployeeLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	session, err := h.employeeService.AuthenticateEmployee(&req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"session": session,
	})
}

// LogoutEmployee handles employee logout
func (h *EmployeeHandler) LogoutEmployee(c *gin.Context) {
	token := c.GetHeader("Authorization")
	if token != "" {
		token = token[7:] // Remove "Bearer " prefix
		h.employeeService.Logout(token)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Logged out successfully",
	})
}

// Employee Profile

// GetEmployeeProfile gets current employee's profile
func (h *EmployeeHandler) GetEmployeeProfile(c *gin.Context) {
	employeeID := c.GetString("employee_id")
	if employeeID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Employee not authenticated"})
		return
	}

	employee, err := h.employeeService.GetEmployeeByID(employeeID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Employee not found"})
		return
	}

	// Don't return sensitive information
	employee.Password = ""
	employee.Salary = nil

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"employee": employee,
	})
}

// Employee Management (requires manage_employees permission)

// CreateEmployee creates a new employee
func (h *EmployeeHandler) CreateEmployee(c *gin.Context) {
	fmt.Printf("🔥 CreateEmployee handler called from %s\n", c.ClientIP())
	companyID := c.GetString("company_id")
	fmt.Printf("🔥 Company ID: %s\n", companyID)
	if companyID == "" {
		fmt.Printf("🔥 ERROR: Company ID is empty\n")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID required"})
		return
	}

	var req models.EmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Printf("🔥 ERROR: Failed to bind JSON: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format: " + err.Error()})
		return
	}
	fmt.Printf("🔥 Request data: %+v\n", req)

	employee, err := h.employeeService.CreateEmployee(companyID, &req)
	if err != nil {
		fmt.Printf("🔥 ERROR: CreateEmployee service failed: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create employee: " + err.Error()})
		return
	}
	fmt.Printf("🔥 SUCCESS: Employee created with ID: %s\n", employee.ID)

	c.JSON(http.StatusCreated, gin.H{
		"success":  true,
		"employee": employee,
	})
}

// GetCompanyEmployees gets all employees for the company
func (h *EmployeeHandler) GetCompanyEmployees(c *gin.Context) {
	companyID := c.GetString("company_id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID required"})
		return
	}

	includeInactive, _ := strconv.ParseBool(c.DefaultQuery("include_inactive", "false"))

	employees, err := h.employeeService.GetEmployeesByCompany(companyID, includeInactive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get employees"})
		return
	}

	// Filter sensitive information based on permissions
	employeePermissions := c.GetStringSlice("employee_permissions")
	canViewSalaries := h.hasPermission(employeePermissions, "view_salaries")

	for i := range employees {
		employees[i].Password = ""
		if !canViewSalaries {
			employees[i].Salary = nil
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"employees": employees,
	})
}

// GetEmployee gets specific employee by ID
func (h *EmployeeHandler) GetEmployee(c *gin.Context) {
	employeeID := c.Param("employeeId")
	if employeeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Employee ID required"})
		return
	}

	employee, err := h.employeeService.GetEmployeeByID(employeeID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Employee not found"})
		return
	}

	// Check if current employee can view this employee
	currentEmployeeID := c.GetString("employee_id")
	employeePermissions := c.GetStringSlice("employee_permissions")

	// Can view own profile or if has view_employees permission
	if currentEmployeeID != employeeID && !h.hasPermission(employeePermissions, "view_employees") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	// Filter sensitive information
	employee.Password = ""
	if !h.hasPermission(employeePermissions, "view_salaries") {
		employee.Salary = nil
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"employee": employee,
	})
}

// UpdateEmployee updates employee information
func (h *EmployeeHandler) UpdateEmployee(c *gin.Context) {
	employeeID := c.Param("employeeId")
	if employeeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Employee ID required"})
		return
	}

	var req models.EmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	employee, err := h.employeeService.UpdateEmployee(employeeID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update employee"})
		return
	}

	employee.Password = ""
	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"employee": employee,
	})
}

// UpdateEmployeePermissions updates employee permissions
func (h *EmployeeHandler) UpdateEmployeePermissions(c *gin.Context) {
	employeeID := c.Param("employeeId")
	if employeeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Employee ID required"})
		return
	}

	var req struct {
		Permissions []string `json:"permissions" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.employeeService.UpdateEmployeePermissions(employeeID, req.Permissions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update permissions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Permissions updated successfully",
	})
}

// DeactivateEmployee deactivates an employee
func (h *EmployeeHandler) DeactivateEmployee(c *gin.Context) {
	employeeID := c.Param("employeeId")
	if employeeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Employee ID required"})
		return
	}

	// Prevent self-deactivation
	currentEmployeeID := c.GetString("employee_id")
	if currentEmployeeID == employeeID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot deactivate yourself"})
		return
	}

	err := h.employeeService.DeactivateEmployee(employeeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deactivate employee"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Employee deactivated successfully",
	})
}

// Permission and Role Management

// GetAvailablePermissions gets all available permissions
func (h *EmployeeHandler) GetAvailablePermissions(c *gin.Context) {
	permissions, err := h.employeeService.GetAvailablePermissions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get permissions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"permissions": permissions,
	})
}

// GetAvailableRoles gets all available roles
func (h *EmployeeHandler) GetAvailableRoles(c *gin.Context) {
	roles, err := h.employeeService.GetAvailableRoles()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get roles"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"roles":   roles,
	})
}

// CheckPermission checks if current employee has specific permission
func (h *EmployeeHandler) CheckPermission(c *gin.Context) {
	permission := c.Param("permission")
	if permission == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Permission required"})
		return
	}

	employeeID := c.GetString("employee_id")
	if employeeID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Employee not authenticated"})
		return
	}

	hasPermission, err := h.employeeService.HasPermission(employeeID, permission)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permission"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":        true,
		"has_permission": hasPermission,
		"permission":     permission,
	})
}

// GetEmployeeDashboard gets dashboard data based on employee permissions
func (h *EmployeeHandler) GetEmployeeDashboard(c *gin.Context) {
	employeeID := c.GetString("employee_id")
	companyID := c.GetString("company_id")
	permissions := c.GetStringSlice("employee_permissions")

	dashboard := make(map[string]interface{})

	// Basic employee info
	employee, err := h.employeeService.GetEmployeeByID(employeeID)
	if err == nil {
		employee.Password = ""
		employee.Salary = nil
		dashboard["employee"] = employee
	}

	// Add data based on permissions
	if h.hasPermission(permissions, "view_bookings") {
		dashboard["can_view_bookings"] = true
	}

	if h.hasPermission(permissions, "view_customers") {
		dashboard["can_view_customers"] = true
	}

	if h.hasPermission(permissions, "view_analytics") {
		dashboard["can_view_analytics"] = true
	}

	if h.hasPermission(permissions, "view_financials") {
		dashboard["can_view_financials"] = true
	}

	if h.hasPermission(permissions, "manage_employees") {
		dashboard["can_manage_employees"] = true
	}

	dashboard["permissions"] = permissions
	dashboard["company_id"] = companyID

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"dashboard": dashboard,
	})
}

// Helper functions

func (h *EmployeeHandler) hasPermission(permissions []string, required string) bool {
	for _, perm := range permissions {
		if perm == "all" || perm == required {
			return true
		}
	}
	return false
}
