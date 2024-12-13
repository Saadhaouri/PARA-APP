// Services/orderServices.ts

import axiosApi from "../Config/axiosAPI";
import { Order, CreateOrder } from "../Types/OrderTypes";

const API_URL = "/Order"; // Base URL is already handled in axiosApi

export const getAllOrders = async (): Promise<Order[]> => {
  const response = await axiosApi.get(API_URL);
  return response.data;
};

export const getOrderById = async (orderId: string): Promise<Order> => {
  const response = await axiosApi.get(`${API_URL}/${orderId}`);
  return response.data;
};

export const createOrder = async (order: CreateOrder): Promise<Order> => {
  const response = await axiosApi.post(API_URL, order);
  return response.data;
};

export const updateOrder = async (
  orderId: string,
  order: Order
): Promise<void> => {
  await axiosApi.put(`${API_URL}/${orderId}`, order);
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  await axiosApi.delete(`${API_URL}/${orderId}`);
};
