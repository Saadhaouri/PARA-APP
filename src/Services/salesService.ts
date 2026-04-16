import axiosApi from "../Config/axiosAPI";
import { AddSale } from "../Types/SaleTypes";

const API_URL = "/Sales";
const API_URL_Product = "/Product";

// Récupération des ventes
export const getDailySales = async () =>
  (await axiosApi.get(`${API_URL}/daily-sales`)).data;

export const getWeeklySales = async () =>
  (await axiosApi.get(`${API_URL}/weekly-sales`)).data;

export const getMonthlySales = async () =>
  (await axiosApi.get(`${API_URL}/monthly-sales`)).data;

// Ajout d'une vente
export const addSale = async (saleData: AddSale) => {
  try {
    return (await axiosApi.post(`${API_URL}`, saleData)).data;
  } catch (error) {
    console.error("Erreur lors de l'ajout de la vente!", error);
    throw error;
  }
};

// Mise à jour d'une vente
export const updateSale = async (id: string, data: AddSale) => {
  try {
    return (await axiosApi.put(`${API_URL}/${id}`, data)).data;
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la vente!", error);
    throw error;
  }
};

// Suppression d'une vente
export const deleteSale = async (id: string) => {
  try {
    return (await axiosApi.delete(`${API_URL}/${id}`)).data;
  } catch (error) {
    console.error("Erreur lors de la suppression de la vente!", error);
    throw error;
  }
};

// Récupération des produits
export const getAllProducts = async () =>
  (await axiosApi.get(API_URL_Product)).data;

// Récupération du profit total
export const getTotalDailyProfit = async () =>
  (await axiosApi.get(`${API_URL}/total-daily-profit`)).data.totalDailyProfit;

export const getTotalWeeklyProfit = async () =>
  (await axiosApi.get(`${API_URL}/total-weekly-profit`)).data.totalWeeklyProfit;

export const getTotalMonthlyProfit = async () =>
  (await axiosApi.get(`${API_URL}/total-monthly-profit`)).data.totalMonthlyProfit;

// Récupération du capital total
export const getTotalDailyCapital = async () =>
  (await axiosApi.get(`${API_URL}/total-daily-capital`)).data.totalDailyCapital;

export const getTotalWeeklyCapital = async () =>
  (await axiosApi.get(`${API_URL}/total-weekly-capital`)).data.totalWeeklyCapital;

export const getTotalMonthlyCapital = async () =>
  (await axiosApi.get(`${API_URL}/total-monthly-capital`)).data.totalMonthlyCapital;

// Suppression de toutes les ventes
export const deleteAllSales = async () => {
  try {
    return (await axiosApi.delete(`${API_URL}/delete-all-sales`)).data;
  } catch (error) {
    console.error("Erreur lors de la suppression de toutes les ventes!", error);
    throw error;
  }
};

// Récupération paginée de toutes les ventes
export const getAllSales = async (page = 1, pageSize = 20) => {
  try {
    return (
      await axiosApi.get(`${API_URL}/all-sales`, {
        params: { page, pageSize },
      })
    ).data;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de toutes les ventes!",
      error
    );
    throw error;
  }
};

// Optionnel : récupérer seulement les dernières ventes
export const getLatestSales = async (count = 20) => {
  try {
    return (
      await axiosApi.get(`${API_URL}/latest-sales`, {
        params: { count },
      })
    ).data;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des dernières ventes!",
      error
    );
    throw error;
  }
};

// Récupération du capital et des bénéfices
export const getCapitalAndBenefits = async (
  year: number,
  month?: number | null
) => {
  try {
    return (
      await axiosApi.get(`${API_URL}/capital-benefits`, {
        params: { year, month },
      })
    ).data;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du capital et des bénéfices!",
      error
    );
    throw error;
  }
};