import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { FcExpired } from "react-icons/fc";
import { FaBoxOpen } from "react-icons/fa";
import { getProductsExpiringWithinAMonth } from "../../Services/productservices";
import Product from "../../Types/ProductType";

const ProductsExpiringSoon = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getProductsExpiringWithinAMonth();
        setProducts(result || []);
      } catch (error) {
        console.error("Failed to fetch expiring products:", error);
        setProducts([]);
      }
    };

    fetchData();
  }, []);

  const totalPages = Math.ceil(products.length / itemsPerPage);

  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return products.slice(startIndex, endIndex);
  }, [products, currentPage]);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-3 rounded-full bg-emerald-50 p-4">
            <FaBoxOpen className="text-4xl text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            Aucun produit n'expire bientôt
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Tous les produits sont encore valides pour le moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
      <div className="border-b border-emerald-50 bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold md:text-2xl">
              Produits expirant bientôt
            </h2>
            <p className="mt-1 text-sm text-emerald-50">
              Liste des produits qui expirent dans moins d’un mois
            </p>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-lg font-bold backdrop-blur-sm">
            {products.length}
          </div>
        </div>
      </div>

      <div className="p-5">
        <ul className="space-y-3">
          {currentProducts.map((product) => (
            <li
              key={product.productID}
              className="group flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md"
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-gray-800 md:text-lg">
                  {product.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Date d'expiration :
                  <span className="ml-1 font-medium text-rose-500">
                    {format(new Date(product.dateExp), "dd MMMM yyyy")}
                  </span>
                </p>
              </div>

              <div className="shrink-0 rounded-full bg-rose-50 p-3">
                <FcExpired className="text-3xl" />
              </div>
            </li>
          ))}
        </ul>

        {totalPages > 1 && (
          <div className="mt-6 flex flex-col gap-4 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Page <span className="font-semibold text-gray-800">{currentPage}</span> sur{" "}
              <span className="font-semibold text-gray-800">{totalPages}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-emerald-300 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Précédent
              </button>

              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`min-w-[40px] rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      currentPage === page
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "border border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:text-emerald-600"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-emerald-300 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsExpiringSoon;