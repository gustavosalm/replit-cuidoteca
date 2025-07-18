import { apiRequest } from "./queryClient";

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const authenticatedApiRequest = async (
  method: string,
  url: string,
  data?: unknown
) => {
  const headers = getAuthHeaders();
  return apiRequest(method, url, data, headers);
};
