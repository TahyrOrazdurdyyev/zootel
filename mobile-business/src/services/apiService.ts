import { 
  Employee, Company, Booking, Service, InventoryItem, 
  DashboardMetrics, Task, CalendarEvent, ChatMessage,
  ApiResponse, LoginCredentials, AuthTokens, IntegrationSettings
} from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8080/api' 
  : 'https://your-production-api.com/api';

class ApiService {
  private static instance: ApiService;
  private baseURL: string = API_BASE_URL;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Get auth token from storage
  private async getAuthToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Generic request method
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth methods
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const response = await this.request<AuthTokens>('/auth/employee/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && response.data) {
      // Store tokens
      await AsyncStorage.setItem('accessToken', response.data.accessToken);
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      await AsyncStorage.setItem('tokenExpiresAt', response.data.expiresAt);
    }
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage regardless of API call success
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'tokenExpiresAt']);
    }
  }

  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.request<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (response.success && response.data) {
      await AsyncStorage.setItem('accessToken', response.data.accessToken);
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      await AsyncStorage.setItem('tokenExpiresAt', response.data.expiresAt);
    }

    return response.data;
  }

  async getCurrentEmployee(): Promise<Employee> {
    const response = await this.request<Employee>('/auth/me');
    return response.data;
  }

  // Company methods
  async getCompany(companyId: string): Promise<Company> {
    const response = await this.request<Company>(`/companies/${companyId}`);
    return response.data;
  }

  async updateCompany(companyId: string, data: Partial<Company>): Promise<Company> {
    const response = await this.request<Company>(`/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Dashboard methods
  async getDashboardMetrics(companyId: string): Promise<DashboardMetrics> {
    const response = await this.request<DashboardMetrics>(`/companies/${companyId}/dashboard`);
    return response.data;
  }

  async getTasks(companyId: string, employeeId?: string): Promise<Task[]> {
    const query = employeeId ? `?employeeId=${employeeId}` : '';
    const response = await this.request<Task[]>(`/companies/${companyId}/tasks${query}`);
    return response.data;
  }

  async updateTaskStatus(taskId: string, status: string): Promise<Task> {
    const response = await this.request<Task>(`/tasks/${taskId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return response.data;
  }

  // Booking methods
  async getBookings(
    companyId: string, 
    filters?: { 
      status?: string; 
      employeeId?: string; 
      date?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Booking[]> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await this.request<Booking[]>(`/companies/${companyId}/bookings${query}`);
    return response.data;
  }

  async getBooking(bookingId: string): Promise<Booking> {
    const response = await this.request<Booking>(`/bookings/${bookingId}`);
    return response.data;
  }

  async updateBookingStatus(bookingId: string, status: string): Promise<Booking> {
    const response = await this.request<Booking>(`/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return response.data;
  }

  async addBookingNotes(bookingId: string, notes: string): Promise<Booking> {
    const response = await this.request<Booking>(`/bookings/${bookingId}/notes`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    });
    return response.data;
  }

  // Calendar methods
  async getCalendarEvents(
    companyId: string, 
    employeeId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<CalendarEvent[]> {
    const queryParams = new URLSearchParams();
    if (employeeId) queryParams.append('employeeId', employeeId);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await this.request<CalendarEvent[]>(`/companies/${companyId}/calendar${query}`);
    return response.data;
  }

  // Inventory methods
  async getInventoryItems(companyId: string): Promise<InventoryItem[]> {
    const response = await this.request<InventoryItem[]>(`/companies/${companyId}/inventory`);
    return response.data;
  }

  async updateInventoryItem(itemId: string, data: Partial<InventoryItem>): Promise<InventoryItem> {
    const response = await this.request<InventoryItem>(`/inventory/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async createInventoryItem(companyId: string, data: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    const response = await this.request<InventoryItem>(`/companies/${companyId}/inventory`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Services methods
  async getServices(companyId: string): Promise<Service[]> {
    const response = await this.request<Service[]>(`/companies/${companyId}/services`);
    return response.data;
  }

  // Chat methods
  async getChatMessages(bookingId: string): Promise<ChatMessage[]> {
    const response = await this.request<ChatMessage[]>(`/bookings/${bookingId}/chat`);
    return response.data;
  }

  async sendChatMessage(
    bookingId: string, 
    message: string, 
    messageType: 'text' | 'image' | 'file' = 'text'
  ): Promise<ChatMessage> {
    const response = await this.request<ChatMessage>(`/bookings/${bookingId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, messageType }),
    });
    return response.data;
  }

  // Employee management methods
  async getEmployees(companyId: string): Promise<Employee[]> {
    const response = await this.request<Employee[]>(`/companies/${companyId}/employees`);
    return response.data;
  }

  async createEmployee(companyId: string, data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    const response = await this.request<Employee>(`/companies/${companyId}/employees`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateEmployee(employeeId: string, data: Partial<Employee>): Promise<Employee> {
    const response = await this.request<Employee>(`/employees/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deactivateEmployee(employeeId: string): Promise<Employee> {
    const response = await this.request<Employee>(`/employees/${employeeId}/deactivate`, {
      method: 'PUT',
    });
    return response.data;
  }

  // Services Management
  async getCompanyServices(companyId: string): Promise<Service[]> {
    const response = await this.request<{ services: Service[] }>(`/companies/${companyId}/services`);
    return response.data.services || [];
  }

  async createService(companyId: string, serviceData: any): Promise<Service> {
    const response = await this.request<{ service: Service }>(`/companies/${companyId}/services`, {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
    return response.data.service;
  }

  async updateService(serviceId: string, serviceData: any): Promise<Service> {
    const response = await this.request<{ service: Service }>(`/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
    return response.data.service;
  }

  async deleteService(serviceId: string): Promise<void> {
    await this.request(`/services/${serviceId}`, {
      method: 'DELETE',
    });
  }

  async getServiceAvailability(serviceId: string, date: string, employeeId?: string): Promise<any[]> {
    const params = new URLSearchParams({ date });
    if (employeeId) params.append('employee_id', employeeId);
    
    const response = await this.request<{ slots: any[] }>(`/services/${serviceId}/availability?${params}`);
    return response.data.slots || [];
  }

  async getCompanyEmployees(companyId: string): Promise<Employee[]> {
    const response = await this.request<{ employees: Employee[] }>(`/companies/${companyId}/employees`);
    return response.data.employees || [];
  }

  // Company Limits & Addons
  async getCompanyLimits(companyId: string): Promise<any> {
    const response = await this.request<{ limits: any }>(`/companies/${companyId}/limits`);
    return response.data.limits;
  }

  async checkAIAgentAccess(companyId: string, agentKey: string): Promise<boolean> {
    const response = await this.request<{ has_access: boolean }>(
      `/companies/${companyId}/ai-agents/${agentKey}/access`
    );
    return response.data.has_access;
  }

  async getCompanyAIAgents(companyId: string): Promise<string[]> {
    const response = await this.request<{ ai_agents: string[] }>(`/companies/${companyId}/ai-agents`);
    return response.data.ai_agents || [];
  }

  async checkFeatureAccess(companyId: string, featureKey: string): Promise<boolean> {
    const response = await this.request<{ has_feature: boolean }>(
      `/companies/${companyId}/features/${featureKey}/access`
    );
    return response.data.has_feature;
  }

  // Image Upload for Services
  async uploadServiceImage(imageUri: string, companyId: string): Promise<{ fileId: string; url: string }> {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'service-image.jpg',
    } as any);

    const response = await this.request<{ file: { id: string; url: string } }>(`/companies/${companyId}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return {
      fileId: response.data.file.id,
      url: response.data.file.url,
    };
  }

  // Chat Messages (Company-wide)
  async getCompanyChatMessages(companyId: string): Promise<ApiResponse<ChatMessage[]>> {
    return this.request<ChatMessage[]>(`/companies/${companyId}/chat/messages`);
  }

  async sendCompanyChatMessage(companyId: string, message: Partial<ChatMessage>): Promise<ApiResponse<ChatMessage>> {
    return this.request<ChatMessage>(`/companies/${companyId}/chat/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  // Integration Settings
  async getIntegrationSettings(companyId: string): Promise<ApiResponse<IntegrationSettings>> {
    return this.request<IntegrationSettings>(`/companies/${companyId}/integration/settings`);
  }

  async updateIntegrationSettings(companyId: string, settings: any): Promise<ApiResponse<IntegrationSettings>> {
    return this.request<IntegrationSettings>(`/companies/${companyId}/integration/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async regenerateAPIKey(companyId: string): Promise<ApiResponse<{ api_key: string }>> {
    return this.request<{ api_key: string }>(`/companies/${companyId}/integration/regenerate-key`, {
      method: 'POST',
    });
  }

  async getMarketplaceEligibility(companyId: string): Promise<ApiResponse<{ can_toggle_marketplace: boolean; reason?: string }>> {
    return this.request<{ can_toggle_marketplace: boolean; reason?: string }>(`/companies/${companyId}/marketplace/eligibility`);
  }

  async updateMarketplaceVisibility(companyId: string, visible: boolean): Promise<ApiResponse<any>> {
    return this.request<any>(`/companies/${companyId}/marketplace/visibility`, {
      method: 'PUT',
      body: JSON.stringify({ visible }),
    });
  }

  // AI Assistant
  async sendAIMessage(companyId: string, data: {
    agentKey: string;
    message: string;
    conversationHistory: any[];
  }): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/companies/${companyId}/ai/chat`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export default ApiService.getInstance(); 