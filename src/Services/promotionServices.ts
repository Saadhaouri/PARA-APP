import axiosApi from "../Config/axiosAPI"; // Import the configured axios instance
import { Promotion, CreatePromotion } from "../Types/Promotion";

const API_URL = "/Promotion"; // Base URL is already handled in axiosApi

export const getAllPromotions = async (): Promise<Promotion[]> => {
  const response = await axiosApi.get(API_URL); // Using axiosApi instead of axios
  return response.data;
};

export const getPromotionById = async (
  promotionId: string
): Promise<Promotion> => {
  const response = await axiosApi.get(`${API_URL}/${promotionId}`); // Using axiosApi for the request
  return response.data;
};

export const createPromotion = async (
  promotion: CreatePromotion
): Promise<Promotion> => {
  const response = await axiosApi.post(API_URL, promotion); // Using axiosApi for the POST request
  return response.data;
};

export const updatePromotion = async (
  promotionId: string,
  promotion: Promotion
): Promise<void> => {
  await axiosApi.put(`${API_URL}/${promotionId}`, promotion); // Using axiosApi for the PUT request
};

export const deletePromotion = async (promotionId: string): Promise<void> => {
  await axiosApi.delete(`${API_URL}/${promotionId}`); // Using axiosApi for the DELETE request
};
