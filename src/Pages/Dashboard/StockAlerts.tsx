import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaArrowRight, FaBoxOpen, FaExclamationTriangle } from "react-icons/fa";
import Product from "../../Types/ProductType";

const API_URL = "http://localhost:5133/Product";

export const getAllProducts = async (): Promise<Product[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

const StockAlerts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const allProducts = await getAllProducts();

        const lowStockProducts = allProducts.filter(
          (product: Product) => product.quantity < 5
        );

        setProducts(lowStockProducts);
        setCurrentIndex(0);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Une erreur inattendue est survenue.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const totalProductsCount = products.length;

  const currentProduct = useMemo(() => {
    if (products.length === 0) return null;
    return products[currentIndex];
  }, [products, currentIndex]);

  const handleNext = () => {
    if (products.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const handlePrevious = () => {
    if (products.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const getStockLevelStyle = (quantity: number) => {
    if (quantity <= 3) {
      return "bg-red-100 text-red-600 border-red-200";
    }
    if (quantity <= 6) {
      return "bg-amber-100 text-amber-600 border-amber-200";
    }
    return "bg-emerald-100 text-emerald-600 border-emerald-200";
  };

  if (loading) {
    return (
      <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-48 rounded bg-gray-200"></div>
          <div className="rounded-xl bg-gray-100 p-4">
            <div className="mb-3 h-5 w-3/4 rounded bg-gray-200"></div>
            <div className="h-4 w-1/3 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 text-red-600">
          <FaExclamationTriangle className="text-2xl" />
          <div>
            <h3 className="font-semibold">Erreur de chargement</h3>
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-3 rounded-full bg-emerald-50 p-4">
            <FaBoxOpen className="text-4xl text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            Aucun produit en faible stock
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Tous les produits ont un stock suffisant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold md:text-2xl">Alertes de stock</h2>
            <p className="mt-1 text-sm text-emerald-50">
              Produits avec une quantité inférieure à 5
            </p>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-lg font-bold backdrop-blur-sm">
            {totalProductsCount}
          </div>
        </div>
      </div>

      <div className="p-5">
        {currentProduct && (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 transition hover:shadow-md">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold text-gray-800 md:text-xl">
                  {currentProduct.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Produit en rupture partielle, vérifiez le réapprovisionnement.
                </p>
              </div>

              <div
                className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold ${getStockLevelStyle(
                  currentProduct.quantity
                )}`}
              >
                Qté : {currentProduct.quantity}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-gray-500">
                Produit <span className="font-semibold text-gray-800">{currentIndex + 1}</span> sur{" "}
                <span className="font-semibold text-gray-800">{totalProductsCount}</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevious}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-emerald-300 hover:text-emerald-600"
                >
                  <FaArrowLeft />
                  Précédent
                </button>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
                >
                  Suivant
                  <FaArrowRight />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAlerts;