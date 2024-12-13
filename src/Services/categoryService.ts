import axiosApi from '../Config/axiosAPI';
import { Category } from '../Types/CategoryType';

const API_URL = '/Category';

export const getAllCategories = async () => {
  const response = await axiosApi.get(API_URL);
  return response.data;
};

export const getCategoryById = async (id: string) => {
  const response = await axiosApi.get(`${API_URL}/${id}`);
  return response.data;
};

export const createCategory = async (category: Category) => {
  const response = await axiosApi.post(API_URL, category);
  return response.data;
};

export const updateCategory = async (id: string, category: Category) => {
  const response = await axiosApi.put(`${API_URL}/${id}`, category);
  return response.data;
};

export const deleteCategory = async (id: string) => {
  const response = await axiosApi.delete(`${API_URL}/${id}`);
  return response.data;
};

export const getProductsByCategoryId = async (categoryId: string) => {
  const response = await axiosApi.get(`${API_URL}/${categoryId}/products`);
  return response.data;
};
