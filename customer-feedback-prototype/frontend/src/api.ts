import axios from "axios";
export const api = axios.create({ baseURL: "http://localhost:8000/api" });
export const get = async <T>(url: string, params?: any): Promise<T> =>
  (await api.get(url, { params })).data;
export const post = async <T>(url: string, data?: any): Promise<T> =>
  (await api.post(url, data)).data;
