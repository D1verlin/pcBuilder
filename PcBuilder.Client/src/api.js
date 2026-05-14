import axios from 'axios';

const API_URL = 'http://localhost:5213/api'; 

export const getCategories = () => axios.get(`${API_URL}/components/categories`);
export const getFilters = (categoryId) => axios.get(`${API_URL}/components/filters?categoryId=${categoryId}`);

export const getComponents = (params) => {
    const query = new URLSearchParams(params).toString();
    return axios.get(`${API_URL}/components?${query}`);
};

export const validateBuild = (build) => axios.post(`${API_URL}/build/validate`, build);
export const getBenchmarks = (build) => axios.post(`${API_URL}/build/benchmarks`, build);
export const getScenarios = () => axios.get(`${API_URL}/components/scenarios`);

// --- Admin API ---
const authHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const loginAdmin = (credentials) => axios.post(`${API_URL}/auth/login`, credentials);

export const adminGetComponents = (params) => {
    const query = new URLSearchParams(params || {}).toString();
    return axios.get(`${API_URL}/admin/components?${query}`, authHeaders());
};
export const adminCreateComponent = (comp) => axios.post(`${API_URL}/admin/components`, comp, authHeaders());
export const adminUpdateComponent = (id, comp) => axios.put(`${API_URL}/admin/components/${id}`, comp, authHeaders());
export const adminDeleteComponent = (id) => axios.delete(`${API_URL}/admin/components/${id}`, authHeaders());

export const adminGetCategories = () => axios.get(`${API_URL}/admin/categories`, authHeaders());
export const adminCreateCategory = (cat) => axios.post(`${API_URL}/admin/categories`, cat, authHeaders());
export const adminUpdateCategory = (id, cat) => axios.put(`${API_URL}/admin/categories/${id}`, cat, authHeaders());
export const adminDeleteCategory = (id) => axios.delete(`${API_URL}/admin/categories/${id}`, authHeaders());

export const adminGetBenchmarks = (componentId) => {
  const query = componentId ? `?componentId=${componentId}` : '';
  return axios.get(`${API_URL}/admin/benchmarks${query}`, authHeaders());
};
export const adminCreateBenchmark = (bench) => axios.post(`${API_URL}/admin/benchmarks`, bench, authHeaders());
export const adminUpdateBenchmark = (id, bench) => axios.put(`${API_URL}/admin/benchmarks/${id}`, bench, authHeaders());
export const adminDeleteBenchmark = (id) => axios.delete(`${API_URL}/admin/benchmarks/${id}`, authHeaders());

export const adminGetScenarios = () => axios.get(`${API_URL}/admin/scenarios`, authHeaders());
export const adminCreateScenario = (scen) => axios.post(`${API_URL}/admin/scenarios`, scen, authHeaders());
export const adminUpdateScenario = (id, scen) => axios.put(`${API_URL}/admin/scenarios/${id}`, scen, authHeaders());
export const adminDeleteScenario = (id) => axios.delete(`${API_URL}/admin/scenarios/${id}`, authHeaders());

export const adminGetBuilds = (params) => {
    const query = new URLSearchParams(params || {}).toString();
    return axios.get(`${API_URL}/admin/builds?${query}`, authHeaders());
};
export const adminDeleteBuild = (id) => axios.delete(`${API_URL}/admin/builds/${id}`, authHeaders());
