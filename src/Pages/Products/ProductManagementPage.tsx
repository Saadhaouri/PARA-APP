import { yupResolver } from "@hookform/resolvers/yup";
import { Modal, Pagination, Spin, message } from "antd";
import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import * as yup from "yup";
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "../../Services/productservices";
import { Category } from "../../Types/CategoryType";
import Supplier from "../../Types/Supplier";
import {
  FaBoxOpen,
  FaMoneyBill,
  FaPlus,
  FaSearch,
  FaTrash,
  FaEdit,
  FaSyncAlt,
} from "react-icons/fa";

const productSchema = yup.object({
  qrCode: yup.string().required("Le barecode est requis"),
  name: yup.string().required("Le nom est requis"),
  description: yup.string().required("La description est requise"),
  price: yup.number().typeError("Le prix est requis").required("Le prix est requis"),
  priceForSale: yup
    .number()
    .typeError("Le prix de vente est requis")
    .required("Le prix de vente est requis"),
  quantity: yup
    .number()
    .typeError("La quantité est requise")
    .required("La quantité est requise"),
  categoryID: yup.string().required("La catégorie est requise"),
  supplierId: yup.string().required("Le fournisseur est requis"),
  dateExp: yup.string().required("La date d'expiration est requise"),
});

type ProductBase = {
  qrCode: string;
  name: string;
  description: string;
  price: number;
  priceForSale: number;
  quantity: number;
  categoryID: string;
  supplierId: string;
  dateExp: string;
};

type Product = ProductBase & {
  productID: string;
};

type AddProduct = ProductBase;

interface TotalValueData {
  totalValue: number;
}

const formatDateForInput = (date: string) => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

const normalizeProduct = (product: any): Product => ({
  productID: String(product?.productID ?? ""),
  qrCode: String(product?.qrCode ?? ""),
  name: String(product?.name ?? ""),
  description: String(product?.description ?? ""),
  price: Number(product?.price ?? 0),
  priceForSale: Number(product?.priceForSale ?? 0),
  quantity: Number(product?.quantity ?? 0),
  categoryID: String(product?.categoryID ?? ""),
  supplierId: String(product?.supplierId ?? ""),
  dateExp: String(product?.dateExp ?? ""),
});

const ProductManagementPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [hideCapital, setHideCapital] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [productList, setProductList] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [supplierList, setSupplierList] = useState<Supplier[]>([]);
  const [totalValueMoney, setTotalValueMoney] = useState<TotalValueData | null>(
    null
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const formRef = useRef<HTMLFormElement>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Product>({
    defaultValues: {
      qrCode: "",
      name: "",
      description: "",
      price: 0,
      priceForSale: 0,
      quantity: 0,
      dateExp: "",
      categoryID: "",
      supplierId: "",
    },
    resolver: yupResolver(productSchema) as any,
  });

  const fetchAllData = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [
        productsResponse,
        categoriesResponse,
        supplierResponse,
        totalMoneyResponse,
      ] = await Promise.all([
        axios.get("http://localhost:5133/Product"),
        axios.get("http://localhost:5133/Category"),
        axios.get("http://localhost:5133/Supplier"),
        axios.get<TotalValueData>("http://localhost:5133/Product/total-value"),
      ]);

      const normalizedProducts = (productsResponse.data ?? []).map(normalizeProduct);

      setProductList(normalizedProducts);
      setCategories(categoriesResponse.data ?? []);
      setSupplierList(supplierResponse.data ?? []);
      setTotalValueMoney({
        totalValue: Number(totalMoneyResponse.data?.totalValue ?? 0),
      });
    } catch (error) {
      console.error("Erreur lors du chargement des données :", error);
      message.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    refreshIntervalRef.current = setInterval(() => {
      fetchAllData(true);
    }, 60000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const getSupplierName = (supplierID: string) => {
    const supplier = supplierList.find((s: any) => s.supplierId === supplierID);
    return supplier?.name ?? "Inconnu";
  };

  const getCategoryName = (categoryID: string) => {
    const category = categories.find((c) => c.id === categoryID);
    return category?.name ?? "Inconnue";
  };

  const handleCreateProduct: SubmitHandler<AddProduct> = async (data) => {
    try {
      const response = await createProduct(data);
      const createdProduct = normalizeProduct(response?.data ?? response);

      setProductList((prev) => [createdProduct, ...prev]);
      setIsModalVisible(false);
      message.success("Produit ajouté avec succès");
      reset();
      setPage(1);
    } catch (error) {
      message.error("Erreur lors de l'ajout du produit");
      console.error("Failed to create produit:", error);
    }
  };

  const handleUpdateProduct: SubmitHandler<Product> = async (data) => {
    try {
      await updateProduct(data.productID, data);
      const updatedProduct = normalizeProduct(data);

      setProductList((prev) =>
        prev.map((product) =>
          product.productID === data.productID ? updatedProduct : product
        )
      );

      setIsModalVisible(false);
      message.success("Produit mis à jour avec succès");
    } catch (error) {
      message.error("Erreur lors de la mise à jour du produit");
      console.error("Failed to update product :", error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId);
      setProductList((prev) =>
        prev.filter((product) => product.productID !== productId)
      );
      message.success("Produit supprimé avec succès");
    } catch (error) {
      message.error("Erreur lors de la suppression du produit");
      console.error("Failed to delete produit:", error);
    }
  };

  const confirmDelete = (productId: string) => {
    Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer ce produit ?",
      content: "Cette action ne peut pas être annulée.",
      okText: "Oui",
      okType: "danger",
      cancelText: "Non",
      onOk: () => handleDeleteProduct(productId),
    });
  };

  const showModal = () => {
    setIsEdit(false);
    reset({
      qrCode: "",
      name: "",
      description: "",
      price: 0,
      priceForSale: 0,
      quantity: 0,
      dateExp: new Date().toISOString().split("T")[0],
      categoryID: "",
      supplierId: "",
    });
    setIsModalVisible(true);
  };

  const showEditModal = (product: Product) => {
    setIsEdit(true);
    reset({
      ...product,
      dateExp: formatDateForInput(product.dateExp),
    });
    setIsModalVisible(true);
  };

  const handleOk = () => {
    if (formRef.current) {
      formRef.current.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return productList.filter((product) => {
      const name = String(product.name ?? "").toLowerCase();
      const description = String(product.description ?? "").toLowerCase();
      const qrCode = String(product.qrCode ?? "").toLowerCase();

      const matchesSearch =
        !term ||
        name.includes(term) ||
        description.includes(term) ||
        qrCode.includes(term);

      const matchesCategory =
        !selectedCategoryFilter || product.categoryID === selectedCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [productList, searchTerm, selectedCategoryFilter]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategoryFilter]);

  const productCount = productList.length;

  const totalQuantity = useMemo(
    () =>
      productList.reduce(
        (sum, product) => sum + Number(product.quantity ?? 0),
        0
      ),
    [productList]
  );

  const highPriceProducts = useMemo(
    () =>
      productList.filter((product) => Number(product.price ?? 0) > 100).length,
    [productList]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="flex h-[60vh] items-center justify-center">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Gestion de stock</p>
              <h1 className="mt-1 text-3xl font-bold text-gray-800">
                Gestion des Produits
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Interface légère avec actualisation automatique chaque 60 secondes.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={showModal}
                className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-600"
              >
                <FaPlus />
                Ajouter un produit
              </button>

              <button
                onClick={() => fetchAllData(true)}
                className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
                Actualiser
              </button>

              <button
                onClick={() => setHideCapital(true)}
                className="flex items-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-yellow-500"
              >
                <FaMoneyBill />
                Capital
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-green-400 p-5 text-white shadow-sm">
            <p className="text-sm opacity-90">Nombre de produits</p>
            <h2 className="mt-2 text-3xl font-extrabold">{productCount}</h2>
          </div>

          <div className="rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-400 p-5 text-white shadow-sm">
            <p className="text-sm opacity-90">Quantité totale</p>
            <h2 className="mt-2 text-3xl font-extrabold">{totalQuantity}</h2>
          </div>

          <div className="rounded-3xl bg-gradient-to-r from-red-500 to-rose-400 p-5 text-white shadow-sm">
            <p className="text-sm opacity-90">Produits chers</p>
            <h2 className="mt-2 text-3xl font-extrabold">{highPriceProducts}</h2>
          </div>

          <div className="rounded-3xl bg-gradient-to-r from-violet-500 to-purple-400 p-5 text-white shadow-sm">
            <p className="text-sm opacity-90">Capital total</p>
            <h2 className="mt-2 text-3xl font-extrabold">
              {Number(totalValueMoney?.totalValue ?? 0)} DH
            </h2>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="relative lg:col-span-2">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, description ou code-barres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 py-3 pl-11 pr-4 outline-none transition focus:border-emerald-400"
              />
            </div>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-emerald-400"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((category, index) => (
                <option
                  key={category.id || `category-${index}`}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Liste des produits</h2>
              <p className="text-sm text-gray-500">
                {filteredProducts.length} produit(s) trouvé(s)
              </p>
            </div>

            {refreshing && (
              <span className="text-sm font-medium text-emerald-600">
                Actualisation...
              </span>
            )}
          </div>

          {paginatedProducts.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center text-gray-500">
              <FaBoxOpen className="mb-3 text-5xl text-emerald-500" />
              <h3 className="text-lg font-semibold text-gray-700">
                Aucun produit trouvé
              </h3>
              <p className="mt-1 text-sm">
                Essayez de changer votre recherche ou filtre.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {paginatedProducts.map((product, index) => (
                  <div
                    key={product.productID || `product-${index}`}
                    className="flex min-h-[260px] flex-col justify-between rounded-3xl border border-gray-100 bg-gray-50 p-5 transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div>
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <h3 className="line-clamp-2 text-lg font-bold text-gray-800">
                          {product.name || "Sans nom"}
                        </h3>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {Number(product.quantity ?? 0)} pcs
                        </span>
                      </div>

                      <p className="mb-3 line-clamp-3 text-sm text-gray-500">
                        {product.description || "Aucune description"}
                      </p>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Code-barres</span>
                          <span className="font-medium text-gray-800">
                            {product.qrCode || "-"}
                          </span>
                        </div>

                        <div className="flex justify-between text-gray-600">
                          <span>Catégorie</span>
                          <span className="font-medium text-gray-800">
                            {getCategoryName(product.categoryID)}
                          </span>
                        </div>

                        <div className="flex justify-between text-gray-600">
                          <span>Fournisseur</span>
                          <span className="font-medium text-gray-800">
                            {getSupplierName(product.supplierId)}
                          </span>
                        </div>

                        <div className="flex justify-between text-gray-600">
                          <span>Expiration</span>
                          <span className="font-medium text-gray-800">
                            {product.dateExp
                              ? new Date(product.dateExp).toLocaleDateString()
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-gray-200 pt-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Prix achat</p>
                          <p className="font-bold text-gray-800">
                            {Number(product.price ?? 0)} DH
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Prix vente</p>
                          <p className="font-bold text-emerald-600">
                            {Number(product.priceForSale ?? 0)} DH
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => showEditModal(product)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 py-2.5 font-medium text-blue-600 transition hover:bg-blue-100"
                        >
                          <FaEdit />
                          Modifier
                        </button>

                        <button
                          onClick={() => confirmDelete(product.productID)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-2.5 font-medium text-red-600 transition hover:bg-red-100"
                        >
                          <FaTrash />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={filteredProducts.length}
                  onChange={(newPage) => setPage(newPage)}
                  showSizeChanger={false}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        title={isEdit ? "Modifier Produit" : "Ajouter Produit"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={isEdit ? "Mettre à jour" : "Ajouter"}
        cancelText="Annuler"
      >
        <form
          onSubmit={handleSubmit((data, e) =>
            isEdit
              ? handleUpdateProduct(data as Product)
              : handleCreateProduct(data, e)
          )}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
          ref={formRef}
        >
          <Controller
            name="qrCode"
            control={control}
            render={({ field }) => (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Barecode
                </label>
                <input
                  {...field}
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                />
                {errors.qrCode && (
                  <p className="mt-1 text-sm text-red-500">{errors.qrCode.message}</p>
                )}
              </div>
            )}
          />

          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nom du produit
                </label>
                <input
                  {...field}
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  {...field}
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.description.message}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="supplierId"
            control={control}
            render={({ field }) => (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Fournisseur
                </label>
                <select
                  {...field}
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                >
                  <option value="">Sélectionner un fournisseur</option>
                  {supplierList.map((supplier: any, index) => (
                    <option
                      key={supplier.supplierId || `supplier-${index}`}
                      value={supplier.supplierId}
                    >
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {errors.supplierId && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.supplierId.message}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="categoryID"
            control={control}
            render={({ field }) => (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Catégorie
                </label>
                <select
                  {...field}
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((category, index) => (
                    <option
                      key={category.id || `category-${index}`}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryID && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.categoryID.message}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Prix d'achat
                </label>
                <input
                  {...field}
                  type="number"
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-500">{errors.price.message}</p>
                )}
              </div>
            )}
          />

          <Controller
            name="priceForSale"
            control={control}
            render={({ field }) => (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Prix de vente
                </label>
                <input
                  {...field}
                  type="number"
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                />
                {errors.priceForSale && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.priceForSale.message}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="quantity"
            control={control}
            render={({ field }) => (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Quantité
                </label>
                <input
                  {...field}
                  type="number"
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.quantity.message}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="dateExp"
            control={control}
            render={({ field }) => (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Date d'expiration
                </label>
                <input
                  {...field}
                  type="date"
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                />
                {errors.dateExp && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.dateExp.message}
                  </p>
                )}
              </div>
            )}
          />
        </form>
      </Modal>

      <Modal
        title="Capital total en stock"
        open={hideCapital}
        onOk={() => setHideCapital(false)}
        onCancel={() => setHideCapital(false)}
        okText="Fermer"
        cancelButtonProps={{ style: { display: "none" } }}
      >
        <div className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 p-6 text-white shadow-sm">
          <h2 className="text-lg font-semibold">Total du capital en stock</h2>
          <p className="mt-3 text-3xl font-extrabold">
            {Number(totalValueMoney?.totalValue ?? 0)} DH
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ProductManagementPage;