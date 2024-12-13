// Services/clientServices.ts

import axiosApi from "../Config/axiosAPI";
import { Client, CreateClient } from "../Types/ClientType";

const API_URL = "/Client"; // Base URL already configured in axiosApi

export const createClient = (data: CreateClient) => {
  return axiosApi.post(API_URL, data);
};

export const updateClient = (clientId: string, data: Client) => {
  return axiosApi.put(`${API_URL}/${clientId}`, data);
};

export const deleteClient = (clientId: string) => {
  return axiosApi.delete(`${API_URL}/${clientId}`);
};

export const getClients = () => {
  return axiosApi.get(API_URL);
};

export const getClientById = (clientId: string) => {
  return axiosApi.get(`${API_URL}/${clientId}`);
};
