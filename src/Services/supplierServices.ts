import axiosApi from "../Config/axiosAPI"; // Import the configured axios instance

type SupplierBase = {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  // Include other properties if necessary
};

type Supplier = SupplierBase & {
  supplierId: string;
};

const API_URL = "/Supplier"; // Base URL is already handled in axiosApi

export const getAllSuppliers = async () => {
  const response = await axiosApi.get(API_URL); // Using axiosApi instead of axios
  return response.data;
};

export const getSupplierById = async (supplierId: string) => {
  const response = await axiosApi.get(`${API_URL}/${supplierId}`); // Using axiosApi for the request
  return response.data;
};

export const createSupplier = async (supplier: Supplier) => {
  const response = await axiosApi.post(API_URL, supplier); // Using axiosApi for the POST request
  return response.data;
};

export const updateSupplier = async (
  supplierId: string,
  supplier: Supplier
) => {
  await axiosApi.put(`${API_URL}/${supplierId}`, supplier); // Using axiosApi for the PUT request
};

export const deleteSupplier = async (supplierId: string) => {
  await axiosApi.delete(`${API_URL}/${supplierId}`); // Using axiosApi for the DELETE request
};
