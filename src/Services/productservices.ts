import axiosApi from "../Config/axiosAPI"; // Import the configured axios instance

type ProductBase = {
  name: string;
  description: string;
  price: number;
  priceForSale: number;
  quantity: number;
  categoryID: string;
  dateExp: string;
  // Include other properties if necessary
};

const API_URL = "/Product"; // Base URL is already handled in axiosApi

export const getAllProducts = async () => {
  const response = await axiosApi.get(API_URL);
  return response.data;
};

export const getProductById = async (id: string) => {
  const response = await axiosApi.get(`${API_URL}/${id}`);
  return response.data;
};

export const createProduct = async (product: ProductBase) => {
  const response = await axiosApi.post(API_URL, product);
  return response.data;
};

export const updateProduct = async (id: string, product: ProductBase) => {
  await axiosApi.put(`${API_URL}/${id}`, product);
};

export const deleteProduct = async (id: string) => {
  await axiosApi.delete(`${API_URL}/${id}`);
};

// Additional methods for sales, purchases, and stock management

export const getTotalValueOfProducts = async () => {
  const response = await axiosApi.get(`${API_URL}/total-value`);
  return response.data;
};

export const sellProduct = async (productId: string, quantity: number) => {
  await axiosApi.post(`${API_URL}/${productId}/sell`, { quantity });
};

export const purchaseProduct = async (productId: string, quantity: number) => {
  await axiosApi.post(`${API_URL}/${productId}/purchase`, { quantity });
};

export const checkStock = async (productId: string) => {
  const response = await axiosApi.get(`${API_URL}/${productId}/stock`);
  return response.data;
};

export const checkAvailability = async (
  productId: string,
  desiredQuantity: number
) => {
  const response = await axiosApi.get(`${API_URL}/${productId}/availability`, {
    params: { desiredQuantity },
  });
  return response.data;
};

export const updateStock = async (
  productId: string,
  newStockQuantity: number
) => {
  await axiosApi.post(`${API_URL}/${productId}/update-stock`, {
    newStockQuantity,
  });
};

export const autoReorder = async (thresholdQuantity: number) => {
  await axiosApi.post(`${API_URL}/auto-reorder`, { thresholdQuantity });
};

export const getProductsExpiringWithinAMonth = async () => {
  const response = await axiosApi.get(`${API_URL}/expiring-soon`);
  return response.data;
};
