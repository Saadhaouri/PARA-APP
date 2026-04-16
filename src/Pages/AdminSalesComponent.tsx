import { yupResolver } from "@hookform/resolvers/yup";
import { DatePicker, Input, Modal, Pagination, Select, Spin, message } from "antd";
import type { Dayjs } from "dayjs";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  FaCalendarAlt,
  FaCalendarDay,
  FaCalendarWeek,
  FaPlus,
  FaTrashAlt,
  FaShoppingBag,
  FaSyncAlt,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import * as yup from "yup";
import {
  addSale,
  deleteAllSales,
  getAllProducts,
  getAllSales,
  getDailySales,
  getMonthlySales,
  getTotalDailyCapital,
  getTotalDailyProfit,
  getTotalMonthlyCapital,
  getTotalMonthlyProfit,
  getTotalWeeklyCapital,
  getTotalWeeklyProfit,
  getWeeklySales,
  updateSale,
  deleteSale,
} from "../Services/salesService";
import { AddSale } from "../Types/SaleTypes";

const { RangePicker } = DatePicker;

interface Product {
  productID: string;
  name: string;
  qrCode: string;
}

interface Sale {
  productId: string;
  quantity: number;
  saleDate: string;
  id: string;
  price: number;
  profit: number;
}

const schema = yup.object().shape({
  productID: yup.string().required("Le produit est requis"),
  quantity: yup
    .number()
    .typeError("La quantité est requise")
    .required("La quantité est requise")
    .positive("La quantité doit être positive")
    .integer("La quantité doit être un entier"),
});

const normalizeSale = (sale: any): Sale => ({
  id: String(sale?.id ?? ""),
  productId: String(sale?.productId ?? ""),
  quantity: Number(sale?.quantity ?? 0),
  saleDate: String(sale?.saleDate ?? ""),
  price: Number(sale?.price ?? 0),
  profit: Number(sale?.profit ?? 0),
});

const normalizeProduct = (product: any): Product => ({
  productID: String(product?.productID ?? ""),
  name: String(product?.name ?? ""),
  qrCode: String(product?.qrCode ?? ""),
});

const formatCurrency = (value: number | null | undefined) =>
  `${Number(value ?? 0).toFixed(2)} DH`;

const formatDate = (date: string) => {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const isSaleInRange = (
  saleDate: string,
  start: string | null,
  end: string | null
) => {
  if (!saleDate) return false;

  const current = new Date(saleDate);
  if (Number.isNaN(current.getTime())) return false;

  const currentOnly = new Date(
    current.getFullYear(),
    current.getMonth(),
    current.getDate()
  );

  if (start) {
    const startDate = new Date(start);
    const startOnly = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );
    if (currentOnly < startOnly) return false;
  }

  if (end) {
    const endDate = new Date(end);
    const endOnly = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );
    if (currentOnly > endOnly) return false;
  }

  return true;
};

const sumProfit = (sales: Sale[]) =>
  sales.reduce((acc, sale) => acc + Number(sale.profit ?? 0), 0);

const sumCapital = (sales: Sale[]) =>
  sales.reduce(
    (acc, sale) => acc + Number(sale.price ?? 0) * Number(sale.quantity ?? 0),
    0
  );

type SalesStatCardProps = {
  title: string;
  count: number;
  profit: number | null;
  capital: number | null;
  icon: React.ReactNode;
  gradient: string;
};

const SalesStatCard = ({
  title,
  count,
  profit,
  capital,
  icon,
  gradient,
}: SalesStatCardProps) => {
  return (
    <div className={`rounded-3xl p-5 text-white shadow-sm ${gradient}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <h3 className="mt-2 text-3xl font-extrabold">{count}</h3>
        </div>
        <div className="rounded-2xl bg-white/20 p-3">{icon}</div>
      </div>

      <div className="mt-5 space-y-1 text-sm">
        <p className="font-medium">Bénéfices: {formatCurrency(profit)}</p>
        <p className="font-medium">Capital: {formatCurrency(capital)}</p>
      </div>
    </div>
  );
};

type SalesListCardProps = {
  title: string;
  sales: Sale[];
  getProductName: (productId: string) => string;
  onEdit: (sale: Sale) => void;
  onDelete: (sale: Sale) => void;
  pageSize?: number;
};

const SalesListCard = ({
  title,
  sales,
  getProductName,
  onEdit,
  onDelete,
  pageSize = 6,
}: SalesListCardProps) => {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [sales]);

  const paginatedSales = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sales.slice(start, start + pageSize);
  }, [sales, page, pageSize]);

  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-500">{sales.length} vente(s)</p>
        </div>
      </div>

      {paginatedSales.length === 0 ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-2xl bg-gray-50 text-sm text-gray-500">
          Aucune vente
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedSales.map((sale, index) => (
              <div
                key={sale.id || `${title}-${index}`}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4 transition hover:bg-white hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-gray-800">
                      {getProductName(sale.productId)}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatDate(sale.saleDate)}
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    x{Number(sale.quantity ?? 0)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Prix:{" "}
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(sale.price)}
                    </span>
                  </span>
                  <span className="text-gray-500">
                    Profit:{" "}
                    <span className="font-semibold text-emerald-600">
                      {formatCurrency(sale.profit)}
                    </span>
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => onEdit(sale)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 py-2.5 font-medium text-blue-600 transition hover:bg-blue-100"
                  >
                    <FaEdit />
                    Modifier
                  </button>

                  <button
                    onClick={() => onDelete(sale)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-2.5 font-medium text-red-600 transition hover:bg-red-100"
                  >
                    <FaTrash />
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>

          {sales.length > pageSize && (
            <div className="mt-4 flex justify-center">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={sales.length}
                onChange={setPage}
                size="small"
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

const SalesPageLoader = () => {
  const loadingTexts = [
    "Chargement des ventes...",
    "Préparation des statistiques...",
    "Récupération des produits...",
    "Mise à jour de votre tableau de bord...",
  ];

  const [textIndex, setTextIndex] = React.useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="absolute -left-16 top-10 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-200/20 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-[32px] border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-300/40" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 shadow-lg">
                <FaShoppingBag className="text-3xl text-white" />
              </div>
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-500">
              Dashboard commercial
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-gray-800">
              Chargement en cours
            </h2>

            <p className="mt-3 min-h-[28px] text-base text-gray-500 transition-all duration-300">
              {loadingTexts[textIndex]}
            </p>

            <div className="mt-8 h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-1/2 animate-[loadingBar_2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-500" />
            </div>

            <div className="mt-6 flex items-center gap-2">
              <span className="h-3 w-3 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.3s]" />
              <span className="h-3 w-3 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.15s]" />
              <span className="h-3 w-3 animate-bounce rounded-full bg-blue-500" />
            </div>

            <div className="mt-8 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="mb-3 h-4 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="mb-3 h-8 w-16 animate-pulse rounded bg-gray-300" />
                  <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>

            <p className="mt-8 text-sm text-gray-400">
              Merci de patienter pendant la préparation de vos données.
            </p>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes loadingBar {
            0% {
              transform: translateX(-100%);
              width: 30%;
            }
            50% {
              transform: translateX(60%);
              width: 40%;
            }
            100% {
              transform: translateX(220%);
              width: 30%;
            }
          }
        `}
      </style>
    </div>
  );
};

const AdminSalesComponent : React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);

  const [dailySales, setDailySales] = useState<Sale[]>([]);
  const [weeklySales, setWeeklySales] = useState<Sale[]>([]);
  const [monthlySales, setMonthlySales] = useState<Sale[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [dailyProfit, setDailyProfit] = useState(0);
  const [weeklyProfit, setWeeklyProfit] = useState(0);
  const [monthlyProfit, setMonthlyProfit] = useState(0);

  const [dailyCapital, setDailyCapital] = useState<number | null>(null);
  const [weeklyCapital, setWeeklyCapital] = useState<number | null>(null);
  const [monthlyCapital, setMonthlyCapital] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [dateRange, setDateRange] = useState<[string | null, string | null]>([
    null,
    null,
  ]);

  const [latestSalesPage, setLatestSalesPage] = useState(1);
  const latestSalesPageSize = 8;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddSale>({
    resolver: yupResolver(schema),
    defaultValues: {
      productID: "",
      quantity: 1,
    },
  });

  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<AddSale>({
    resolver: yupResolver(schema),
    defaultValues: {
      productID: "",
      quantity: 1,
    },
  });

  const fetchAllData = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [
        dailySalesResponse,
        weeklySalesResponse,
        monthlySalesResponse,
        allSalesResponse,
        productsResponse,
        dailyProfitResponse,
        weeklyProfitResponse,
        monthlyProfitResponse,
        dailyCapitalResponse,
        weeklyCapitalResponse,
        monthlyCapitalResponse,
      ] = await Promise.all([
        getDailySales(),
        getWeeklySales(),
        getMonthlySales(),
        getAllSales(1, 50),
        getAllProducts(),
        getTotalDailyProfit(),
        getTotalWeeklyProfit(),
        getTotalMonthlyProfit(),
        getTotalDailyCapital(),
        getTotalWeeklyCapital(),
        getTotalMonthlyCapital(),
      ]);

      setDailySales((dailySalesResponse ?? []).map(normalizeSale));
      setWeeklySales((weeklySalesResponse ?? []).map(normalizeSale));
      setMonthlySales((monthlySalesResponse ?? []).map(normalizeSale));
      setAllSales((allSalesResponse ?? []).map(normalizeSale));
      setProducts((productsResponse ?? []).map(normalizeProduct));

      setDailyProfit(Number(dailyProfitResponse ?? 0));
      setWeeklyProfit(Number(weeklyProfitResponse ?? 0));
      setMonthlyProfit(Number(monthlyProfitResponse ?? 0));

      setDailyCapital(Number(dailyCapitalResponse ?? 0));
      setWeeklyCapital(Number(weeklyCapitalResponse ?? 0));
      setMonthlyCapital(Number(monthlyCapitalResponse ?? 0));
    } catch (error) {
      console.error("Failed to fetch sales data", error);
      message.error("Erreur lors du chargement des données de vente");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    intervalRef.current = setInterval(() => {
      fetchAllData(true);
    }, 60000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    setLatestSalesPage(1);
  }, [dateRange]);

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.productID === productId);
    return product?.name || "Produit inconnu";
  };

  const productOptions = useMemo(
    () =>
      products.map((product, index) => ({
        value: product.productID,
        label: product.name || `Produit ${index + 1}`,
      })),
    [products]
  );

  const filteredDailySales = useMemo(
    () =>
      dailySales.filter((sale) =>
        isSaleInRange(sale.saleDate, dateRange[0], dateRange[1])
      ),
    [dailySales, dateRange]
  );

  const filteredWeeklySales = useMemo(
    () =>
      weeklySales.filter((sale) =>
        isSaleInRange(sale.saleDate, dateRange[0], dateRange[1])
      ),
    [weeklySales, dateRange]
  );

  const filteredMonthlySales = useMemo(
    () =>
      monthlySales.filter((sale) =>
        isSaleInRange(sale.saleDate, dateRange[0], dateRange[1])
      ),
    [monthlySales, dateRange]
  );

  const filteredAllSales = useMemo(
    () =>
      allSales.filter((sale) =>
        isSaleInRange(sale.saleDate, dateRange[0], dateRange[1])
      ),
    [allSales, dateRange]
  );

  const mostSoldProduct = useMemo(() => {
    const counts: Record<string, number> = {};

    filteredAllSales.forEach((sale) => {
      const key = sale.productId || "";
      if (!key) return;
      counts[key] = (counts[key] || 0) + Number(sale.quantity ?? 0);
    });

    const entries = Object.entries(counts);
    if (entries.length === 0) {
      return { name: "Aucune vente", count: 0 };
    }

    const [bestProductId, bestCount] = entries.reduce((best, current) =>
      current[1] > best[1] ? current : best
    );

    return {
      name: getProductName(bestProductId),
      count: bestCount,
    };
  }, [filteredAllSales, products]);

  const latestSales = useMemo(() => {
  return [...filteredAllSales].sort(
    (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
  );
}, [filteredAllSales]);

  const paginatedLatestSales = useMemo(() => {
    const start = (latestSalesPage - 1) * latestSalesPageSize;
    return latestSales.slice(start, start + latestSalesPageSize);
  }, [latestSales, latestSalesPage]);

  const displayedDailyProfit =
    dateRange[0] || dateRange[1] ? sumProfit(filteredDailySales) : dailyProfit;
  const displayedWeeklyProfit =
    dateRange[0] || dateRange[1] ? sumProfit(filteredWeeklySales) : weeklyProfit;
  const displayedMonthlyProfit =
    dateRange[0] || dateRange[1]
      ? sumProfit(filteredMonthlySales)
      : monthlyProfit;

  const displayedDailyCapital =
    dateRange[0] || dateRange[1]
      ? sumCapital(filteredDailySales)
      : dailyCapital ?? 0;

  const displayedWeeklyCapital =
    dateRange[0] || dateRange[1]
      ? sumCapital(filteredWeeklySales)
      : weeklyCapital ?? 0;

  const displayedMonthlyCapital =
    dateRange[0] || dateRange[1]
      ? sumCapital(filteredMonthlySales)
      : monthlyCapital ?? 0;

  const onSubmit = async (data: AddSale) => {
    try {
      await addSale(data);
      message.success("Vente ajoutée avec succès");
      setIsModalVisible(false);
      reset({
        productID: "",
        quantity: 1,
      });
      fetchAllData(true);
    } catch (error) {
      console.error(error);
      message.error("Échec de l'ajout de la vente");
    }
  };

  const onUpdateSale = async (data: AddSale) => {
    if (!currentSale) return;

    try {
      await updateSale(currentSale.id, data);

      message.success("Vente mise à jour avec succès");

      setIsEditModalVisible(false);
      setCurrentSale(null);

      fetchAllData(true);
    } catch (error) {
      console.error(error);
      message.error("Échec de la mise à jour de la vente");
    }
  };

  const handleDeleteOneSale = async () => {
    if (!saleToDelete) return;

    try {
      await deleteSale(saleToDelete.id);
      message.success("Vente supprimée avec succès");
      setSaleToDelete(null);
      fetchAllData(true);
    } catch (error) {
      console.error(error);
      message.error("Échec de la suppression de la vente");
    }
  };

  const handleDeleteAllSales = async () => {
    try {
      await deleteAllSales();
      message.success("Toutes les ventes ont été supprimées avec succès");
      setIsDeleteModalVisible(false);
      fetchAllData(true);
    } catch (error) {
      console.error(error);
      message.error("Échec de la suppression des ventes");
    }
  };

  const openEditModal = (sale: Sale) => {
    setCurrentSale(sale);
    resetEdit({
      productID: sale.productId,
      quantity: sale.quantity,
    });
    setIsEditModalVisible(true);
  };

  const openDeleteSaleModal = (sale: Sale) => {
    setSaleToDelete(sale);
  };

  if (loading) {
    return <SalesPageLoader />;
  }

  return (
    <div className="mx-auto min-h-screen bg-gray-50 p-4 md:p-6">
      <Modal
        title="Ajouter une vente"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Produit
            </label>
            <Controller
              name="productID"
              control={control}
              render={({ field }) => (
                <Select
                  showSearch
                  placeholder="Sélectionner un produit"
                  optionFilterProp="label"
                  onChange={(value) => field.onChange(value)}
                  options={productOptions}
                  value={field.value || undefined}
                  className="w-full"
                />
              )}
            />
            {errors.productID && (
              <p className="mt-2 text-sm text-red-600">
                {errors.productID.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Quantité
            </label>
            <Controller
              name="quantity"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  min={1}
                  className={`block w-full rounded-xl border ${
                    errors.quantity ? "border-red-500" : "border-gray-300"
                  } p-3 shadow-sm focus:border-emerald-500 focus:outline-none`}
                />
              )}
            />
            {errors.quantity && (
              <p className="mt-2 text-sm text-red-600">
                {errors.quantity.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-600"
            >
              Ajouter
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        title="Modifier la vente"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setCurrentSale(null);
        }}
        footer={null}
      >
        <form onSubmit={handleEditSubmit(onUpdateSale)} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Produit
            </label>
            <Controller
              name="productID"
              control={editControl}
              render={({ field }) => (
                <Select
                  showSearch
                  placeholder="Sélectionner un produit"
                  optionFilterProp="label"
                  onChange={(value) => field.onChange(value)}
                  options={productOptions}
                  value={field.value || undefined}
                  className="w-full"
                />
              )}
            />
            {editErrors.productID && (
              <p className="mt-2 text-sm text-red-600">
                {editErrors.productID.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Quantité
            </label>
            <Controller
              name="quantity"
              control={editControl}
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  min={1}
                  className={`block w-full rounded-xl border ${
                    editErrors.quantity ? "border-red-500" : "border-gray-300"
                  } p-3 shadow-sm focus:border-emerald-500 focus:outline-none`}
                />
              )}
            />
            {editErrors.quantity && (
              <p className="mt-2 text-sm text-red-600">
                {editErrors.quantity.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-2xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-600"
            >
              Mettre à jour
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        title="Confirmer la suppression"
        open={!!saleToDelete}
        onOk={handleDeleteOneSale}
        onCancel={() => setSaleToDelete(null)}
        okText="Supprimer"
        cancelText="Annuler"
        okButtonProps={{ danger: true }}
      >
        <p>Êtes-vous sûr de vouloir supprimer cette vente ?</p>
      </Modal>

      <Modal
        title="Confirmer la suppression"
        open={isDeleteModalVisible}
        onOk={handleDeleteAllSales}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText="Supprimer"
        cancelText="Annuler"
        okButtonProps={{ danger: true }}
      >
        <p>Êtes-vous sûr de vouloir supprimer toutes les ventes ?</p>
      </Modal>

      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Gestion commerciale
              </p>
              <h1 className="mt-1 text-3xl font-bold text-gray-800">
                Gestion des ventes
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Interface légère, rapide, avec actualisation automatique chaque
                60 secondes.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                onClick={() => setIsModalVisible(true)}
              >
                <FaPlus />
                Ajouter une vente
              </button>

              <button
                className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                onClick={() => fetchAllData(true)}
              >
                <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
                Actualiser
              </button>

              <button
                className="flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-red-600"
                onClick={() => setIsDeleteModalVisible(true)}
              >
                <FaTrashAlt />
                Supprimer tout
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Filtrer par date
              </p>
              <p className="text-xs text-gray-500">
                Sélectionnez une période pour filtrer les ventes affichées
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <RangePicker
                format="DD/MM/YYYY"
                onChange={(dates: null | [Dayjs | null, Dayjs | null]) => {
                  if (!dates || dates.length !== 2) {
                    setDateRange([null, null]);
                    return;
                  }

                  setDateRange([
                    dates[0] ? dates[0].format("YYYY-MM-DD") : null,
                    dates[1] ? dates[1].format("YYYY-MM-DD") : null,
                  ]);
                }}
                className="min-w-[280px]"
              />

              <button
                type="button"
                onClick={() => setDateRange([null, null])}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {refreshing && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <div className="h-1 w-full bg-gray-100">
              <div className="h-full w-1/3 animate-[loadingBar_2s_ease-in-out_infinite] bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-500" />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Spin size="small" />
                <span className="text-sm font-medium text-gray-600">
                  Actualisation des ventes en cours...
                </span>
              </div>
              <span className="text-xs text-emerald-600">
                Veuillez patienter
              </span>
            </div>
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 p-5 text-white shadow-sm">
            <p className="text-sm opacity-90">Top produit</p>
            <h2 className="mt-2 line-clamp-2 text-2xl font-extrabold text-red-700">
              {mostSoldProduct.name}
            </h2>
            <p className="mt-2 text-sm font-medium">
              Quantité vendue: {mostSoldProduct.count}
            </p>
          </div>

          <SalesStatCard
            title="Ventes quotidiennes"
            count={filteredDailySales.length}
            profit={displayedDailyProfit}
            capital={displayedDailyCapital}
            icon={<FaCalendarDay className="h-8 w-8" />}
            gradient="bg-gradient-to-r from-sky-400 to-blue-500"
          />

          <SalesStatCard
            title="Ventes hebdomadaires"
            count={filteredWeeklySales.length}
            profit={displayedWeeklyProfit}
            capital={displayedWeeklyCapital}
            icon={<FaCalendarWeek className="h-8 w-8" />}
            gradient="bg-gradient-to-r from-violet-500 to-purple-500"
          />

          <SalesStatCard
            title="Ventes mensuelles"
            count={filteredMonthlySales.length}
            profit={displayedMonthlyProfit}
            capital={displayedMonthlyCapital}
            icon={<FaCalendarAlt className="h-8 w-8" />}
            gradient="bg-gradient-to-r from-blue-400 to-emerald-400"
          />
        </div>

        <div className="mb-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Dernières ventes
              </h2>
              <p className="text-sm text-gray-500">
                {filteredAllSales.length} vente(s) au total
              </p>
            </div>
            {refreshing && (
              <span className="text-sm font-medium text-emerald-600">
                Actualisation...
              </span>
            )}
          </div>

          {paginatedLatestSales.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center text-gray-500">
              <FaShoppingBag className="mb-3 text-5xl text-emerald-500" />
              <h3 className="text-lg font-semibold text-gray-700">
                Aucune vente
              </h3>
              <p className="mt-1 text-sm">
                Ajoutez une nouvelle vente pour commencer.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
                {paginatedLatestSales.map((sale, index) => (
                  <div
                    key={sale.id || `latest-sale-${index}`}
                    className="rounded-3xl border border-gray-100 bg-gray-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-gray-800">
                          {getProductName(sale.productId)}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {formatDate(sale.saleDate)}
                        </p>
                      </div>

                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        x{Number(sale.quantity ?? 0)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Prix</span>
                        <span className="font-semibold text-gray-800">
                          {formatCurrency(sale.price)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Profit</span>
                        <span className="font-semibold text-emerald-600">
                          {formatCurrency(sale.profit)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => openEditModal(sale)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 py-2.5 font-medium text-blue-600 transition hover:bg-blue-100"
                      >
                        <FaEdit />
                        Modifier
                      </button>

                      <button
                        onClick={() => openDeleteSaleModal(sale)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-2.5 font-medium text-red-600 transition hover:bg-red-100"
                      >
                        <FaTrash />
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {latestSales.length > latestSalesPageSize && (
                <div className="mt-6 flex justify-center">
                  <Pagination
                    current={latestSalesPage}
                    pageSize={latestSalesPageSize}
                    total={latestSales.length}
                    onChange={setLatestSalesPage}
                    showSizeChanger={false}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <SalesListCard
            title="Ventes quotidiennes"
            sales={filteredDailySales}
            getProductName={getProductName}
            onEdit={openEditModal}
            onDelete={openDeleteSaleModal}
          />
          <SalesListCard
            title="Ventes hebdomadaires"
            sales={filteredWeeklySales}
            getProductName={getProductName}
            onEdit={openEditModal}
            onDelete={openDeleteSaleModal}
          />
          <SalesListCard
            title="Ventes mensuelles"
            sales={filteredMonthlySales}
            getProductName={getProductName}
            onEdit={openEditModal}
            onDelete={openDeleteSaleModal}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminSalesComponent ;