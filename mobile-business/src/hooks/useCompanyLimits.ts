import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';

export interface CompanyLimits {
  company_id: string;
  plan_name: string;
  max_employees: number;
  current_employees: number;
  remaining_employees: number;
  ai_agents: string[];
  ai_agents_count: number;
  premium_features: number;
  additional_slots: number;
  can_add_employees: boolean;
  has_ai_access: boolean;
}

export const useCompanyLimits = () => {
  const { employee } = useAuth();

  const {
    data: limits,
    isLoading,
    error,
    refetch,
  } = useQuery<CompanyLimits>({
    queryKey: ['company-limits', employee?.companyId],
    queryFn: () => apiService.getCompanyLimits(employee!.companyId),
    enabled: !!employee?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Helper functions for common checks
  const hasAIAccess = (): boolean => {
    return limits?.has_ai_access || false;
  };

  const hasAIAgent = (agentKey: string): boolean => {
    return limits?.ai_agents?.includes(agentKey) || false;
  };

  const canAddEmployee = (): boolean => {
    return limits?.can_add_employees || false;
  };

  const getEmployeeSlotInfo = () => {
    if (!limits) return null;
    
    return {
      current: limits.current_employees,
      max: limits.max_employees,
      remaining: limits.remaining_employees,
      percentage: Math.round((limits.current_employees / limits.max_employees) * 100),
    };
  };

  const getAIAgentInfo = () => {
    if (!limits) return null;

    return {
      available: limits.ai_agents,
      count: limits.ai_agents_count,
      hasAccess: limits.has_ai_access,
    };
  };

  return {
    limits,
    isLoading,
    error,
    refetch,
    // Helper functions
    hasAIAccess,
    hasAIAgent,
    canAddEmployee,
    getEmployeeSlotInfo,
    getAIAgentInfo,
  };
}; 