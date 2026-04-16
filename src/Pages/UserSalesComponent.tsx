import { yupResolver } from "@hookform/resolvers/yup";
import { Input, Modal, Pagination, Select, Spin, message } from "antd";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  FaBoxOpen,
  FaCalendarAlt,
  FaClock,
  FaPlus,
  FaShoppingBag,
  FaSyncAlt,
} from "react-icons/fa";
import * as yup from "yup";
import { addSale, getAllProducts, getDailySales } from "../Services/salesService";
import { AddSale } from "../Types/SaleTypes";

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

const parseSaleDateForDateOnly = (value: string): Date | null => {
  if (!value || typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  // keep only date part
  const dateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dateMatch) return null;

  const [, year, month, day] = dateMatch;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));

  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const formatDate = (date: string) => {
  const parsed = parseSaleDateForDateOnly(date);
  if (!parsed) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const formatTime = (value: string) => {
  if (!value || typeof value !== "string") return "-";

  const trimmed = value.trim();

  // Matches:
  // 2026-04-11T14:35:22
  // 2026-04-11 14:35:22
  // 2026-04-11T14:35
  // 2026-04-11 14:35
  const match = trimmed.match(/(?:T|\s)(\d{2}):(\d{2})(?::\d{2})?/);

  if (match) {
    return `${match[1]}:${match[2]}`;
  }

  return "-";
};

const getSaleTimestamp = (value: string) => {
  if (!value || typeof value !== "string") return 0;

  const trimmed = value.trim();

  // If backend gives sortable ISO-like string, lexical compare is enough after normalization
  const normalized = trimmed.replace(" ", "T");
  const parsed = Date.parse(normalized);

  if (!Number.isNaN(parsed)) return parsed;

  return 0;
};

const UserSalesComponent: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const fetchAllData = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [dailySalesResponse, productsResponse] = await Promise.all([
        getDailySales(),
        getAllProducts(),
      ]);

      setAllSales((dailySalesResponse ?? []).map(normalizeSale));
      setProducts((productsResponse ?? []).map(normalizeProduct));
    } catch (error) {
      console.error(error);
      message.error("Erreur lors du chargement des ventes du jour");
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

  const latestSales = useMemo(() => {
    return [...allSales].sort(
      (a, b) => getSaleTimestamp(b.saleDate) - getSaleTimestamp(a.saleDate)
    );
  }, [allSales]);

  const paginatedLatestSales = useMemo(() => {
    const start = (latestSalesPage - 1) * latestSalesPageSize;
    return latestSales.slice(start, start + latestSalesPageSize);
  }, [latestSales, latestSalesPage]);

  const totalQuantity = useMemo(
    () => allSales.reduce((acc, sale) => acc + Number(sale.quantity ?? 0), 0),
    [allSales]
  );

  const onSubmit = async (data: AddSale) => {
    try {
      setSubmitting(true);
      await addSale(data);
      message.success("Vente ajoutée avec succès");
      setIsModalVisible(false);
      reset({
        productID: "",
        quantity: 1,
      });
      setLatestSalesPage(1);
      await fetchAllData(true);
    } catch (error) {
      console.error(error);
      message.error("Échec de l'ajout de la vente");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] px-4 py-8 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[28px] border border-white/60 bg-white/80 p-10 shadow-sm backdrop-blur">
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-4">
              <Spin size="large" />
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  Chargement des ventes du jour...
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Veuillez patienter pendant la récupération des données.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] px-4 py-6 md:px-6">
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
              <FaPlus />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">
                Ajouter une vente
              </p>
              <p className="text-xs font-normal text-gray-500">
                Enregistrez une nouvelle vente rapidement
              </p>
            </div>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        centered
      >
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-5">
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
                  size="large"
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
                  className="w-full"
                  size="large"
                />
              )}
            />
            {errors.quantity && (
              <p className="mt-2 text-sm text-red-600">
                {errors.quantity.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3.5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Spin size="small" /> : <FaPlus />}
            {submitting ? "Ajout en cours..." : "Ajouter la vente"}
          </button>
        </form>
      </Modal>

      <div className="mx-auto max-w-7xl">
        <div className="mb-6 overflow-hidden rounded-[32px] bg-gradient-to-r from-gray-950 via-gray-900 to-gray-800 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
                Gestion commerciale
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                Tableau de bord des ventes
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/70 md:text-base">
                Suivez les ventes du jour et ajoutez de nouvelles transactions
                en quelques secondes.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-gray-900 transition hover:scale-[1.01]"
                onClick={() => setIsModalVisible(true)}
              >
                <FaPlus />
                Nouvelle vente
              </button>

              <button
                className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/15"
                onClick={() => fetchAllData(true)}
              >
                <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
                Actualiser
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-[28px] border border-white/60 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Nombre de ventes du jour
                </p>
                <h2 className="mt-3 text-2xl font-bold text-gray-900">
                  {allSales.length}
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <FaShoppingBag />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/60 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Quantité vendue aujourd&apos;hui
                </p>
                <h2 className="mt-3 text-2xl font-bold text-gray-900">
                  {totalQuantity}
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <FaBoxOpen />
              </div>
            </div>
          </div>
        </div>

        {refreshing && (
          <div className="mb-6 rounded-[24px] border border-emerald-100 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <Spin size="small" />
              <span className="text-sm font-medium text-gray-600">
                Actualisation des ventes du jour...
              </span>
            </div>
          </div>
        )}

        <div className="rounded-[30px] border border-white/60 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Ventes du jour
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {allSales.length} vente(s) trouvée(s)
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600">
              <FaCalendarAlt />
              Aujourd&apos;hui
            </div>
          </div>

          {paginatedLatestSales.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed border-gray-200 bg-gray-50/70 px-6 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl text-gray-300 shadow-sm">
                <FaShoppingBag />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                Aucune vente aujourd&apos;hui
              </h3>
              <p className="mt-2 max-w-md text-sm text-gray-500">
                Aucune vente n&apos;a été enregistrée aujourd&apos;hui. Ajoutez
                une nouvelle vente pour commencer.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setIsModalVisible(true)}
                  className="rounded-2xl bg-black px-5 py-3 font-semibold text-white transition hover:opacity-90"
                >
                  Ajouter une vente
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {paginatedLatestSales.map((sale, index) => (
                  <div
                    key={sale.id || `latest-sale-${index}`}
                    className="group rounded-[28px] border border-gray-100 bg-gradient-to-b from-white to-gray-50 p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-gray-900">
                          {getProductName(sale.productId)}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          {formatDate(sale.saleDate)}
                        </p>

                        <div className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-gray-600">
                          <FaClock className="text-gray-400" />
                          <span>{formatTime(sale.saleDate)}</span>
                        </div>
                      </div>

                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        x{Number(sale.quantity ?? 0)}
                      </span>
                    </div>

                    <div className="mt-5 space-y-3">
                      <div className="rounded-2xl bg-white p-3 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Prix
                        </p>
                        <p className="mt-1 text-lg font-bold text-gray-900">
                          {formatCurrency(sale.price)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Quantité
                        </p>
                        <p className="mt-1 font-semibold text-gray-800">
                          {Number(sale.quantity ?? 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {latestSales.length > latestSalesPageSize && (
                <div className="mt-8 flex justify-center">
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
      </div>
    </div>
  );
};

export default UserSalesComponent;