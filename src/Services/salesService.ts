import axiosApi from "../Config/axiosAPI"; // Import the configured axios instance
import { AddSale } from "../Types/SaleTypes";

const API_URL = "/Sales"; // Base URL is already handled in axiosApi
const API_URL_Product = "/Product"; // Base URL is already handled in axiosApi

export const getDailySales = async () => {
  const response = await axiosApi.get(`${API_URL}/daily-sales`); // Using axiosApi instead of axios
  return response.data;
};

export const getWeeklySales = async () => {
  const response = await axiosApi.get(`${API_URL}/weekly-sales`); // Using axiosApi for the request
  return response.data;
};

export const getMonthlySales = async () => {
  const response = await axiosApi.get(`${API_URL}/monthly-sales`); // Using axiosApi for the request
  return response.data;
};

export const addSale = async (saleData: AddSale) => {
  try {
    const response = await axiosApi.post(`${API_URL}`, saleData); // Using axiosApi for the POST request
    return response.data;
  } catch (error) {
    console.error("There was an error adding the sale!", error);
    throw error;
  }
};

export const getAllProducts = async () => {
  const response = await axiosApi.get(API_URL_Product); // Using axiosApi for the request
  return response.data;
};

export const getTotalDailyProfit = async () => {
  const response = await axiosApi.get(`${API_URL}/total-daily-profit`); // Using axiosApi for the request
  return response.data.totalDailyProfit; // Assuming the API returns { totalDailyProfit: value }
};

export const getTotalWeeklyProfit = async () => {
  const response = await axiosApi.get(`${API_URL}/total-weekly-profit`); // Using axiosApi for the request
  return response.data.totalWeeklyProfit; // Assuming the API returns { totalWeeklyProfit: value }
};

export const getTotalMonthlyProfit = async () => {
  const response = await axiosApi.get(`${API_URL}/total-monthly-profit`); // Using axiosApi for the request
  return response.data.totalMonthlyProfit; // Assuming the API returns { totalMonthlyProfit: value }
};

// Add the new methods below
export const deleteAllSales = async () => {
  try {
    const response = await axiosApi.delete(`${API_URL}/delete-all-sales`); // Using axiosApi for the DELETE request
    return response.data;
  } catch (error) {
    console.error("There was an error deleting all sales!", error);
    throw error;
  }
};

export const getAllSales = async () => {
  try {
    const response = await axiosApi.get(`${API_URL}/all-sales`); // Using axiosApi for the GET request
    return response.data;
  } catch (error) {
    console.error("There was an error retrieving all sales!", error);
    throw error;
  }
};
