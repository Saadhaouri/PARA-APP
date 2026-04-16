import { yupResolver } from "@hookform/resolvers/yup";
import { Input, Modal, Pagination, Select, Spin, message } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import * as yup from "yup";
import axiosApi from "../Config/axiosAPI";
import {
  createOrder,
  deleteOrder,
  updateOrder,
} from "../Services/orderService";
import { Client } from "../Types/ClientType";
import {
  FaBoxOpen,
  FaEdit,
  FaSearch,
  FaShoppingCart,
  FaSyncAlt,
  FaTrash,
  FaTruck,
  FaUser,
  FaFilter,
} from "react-icons/fa";

type Supplier = {
  supplierId: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
};

type Product = {
  productID: string;
  name: string;
  description: string;
  price: number;
  priceForSale: number;
  quantity: number;
  categoryID: string;
  dateExp: string;
};

interface Order {
  orderID: string;
  supplierId: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  clientId: string;
  productIds: string[];
}

const ORDER_STATUSES = [
  "En attente",
  "En cours",
  "Prêt à expédier",
  "Expédié",
  "Livré",
  "Annulé",
  "Retour demandé",
  "Retour accepté",
  "Retour rejeté",
  "Échoué",
];

const OrderSchema = yup.object().shape({
  orderID: yup.string().required(),
  supplierId: yup.string().required("Le fournisseur est requis"),
  orderDate: yup.string().required("La date de la commande est requise"),
  totalAmount: yup
    .number()
    .typeError("Le montant total est requis")
    .required("Le montant total est requis")
    .positive("Le montant doit être positif"),
  status: yup.string().required("Le statut est requis"),
  clientId: yup.string().required("Le client est requis"),
  productIds: yup
    .array()
    .of(yup.string().required())
    .min(1, "Les produits sont requis")
    .required("Les produits sont requis"),
});

const normalizeOrder = (order: any): Order => ({
  orderID: String(order?.orderID ?? ""),
  supplierId: String(order?.supplierId ?? ""),
  orderDate: String(order?.orderDate ?? ""),
  totalAmount: Number(order?.totalAmount ?? 0),
  status: String(order?.status ?? ""),
  clientId: String(order?.clientId ?? ""),
  productIds: Array.isArray(order?.productIds)
    ? order.productIds.map((id: any) => String(id))
    : [],
});

const normalizeSupplier = (supplier: any): Supplier => ({
  supplierId: String(supplier?.supplierId ?? ""),
  name: String(supplier?.name ?? ""),
  contactPerson: String(supplier?.contactPerson ?? ""),
  email: String(supplier?.email ?? ""),
  phone: String(supplier?.phone ?? ""),
});

const normalizeClient = (client: any): Client => ({
  ...client,
  clientID: String(client?.clientID ?? ""),
  firstname: String(client?.firstname ?? ""),
  lastName: String(client?.lastName ?? ""),
});

const normalizeProduct = (product: any): Product => ({
  productID: String(product?.productID ?? ""),
  name: String(product?.name ?? ""),
  description: String(product?.description ?? ""),
  price: Number(product?.price ?? 0),
  priceForSale: Number(product?.priceForSale ?? 0),
  quantity: Number(product?.quantity ?? 0),
  categoryID: String(product?.categoryID ?? ""),
  dateExp: String(product?.dateExp ?? ""),
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

const getStatusClasses = (status: string) => {
  switch (status) {
    case "Livré":
      return "bg-emerald-100 text-emerald-700";
    case "Expédié":
    case "Prêt à expédier":
      return "bg-blue-100 text-blue-700";
    case "En cours":
    case "En attente":
      return "bg-yellow-100 text-yellow-700";
    case "Annulé":
    case "Échoué":
    case "Retour rejeté":
      return "bg-red-100 text-red-700";
    case "Retour demandé":
    case "Retour accepté":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const OrderManagementPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [orderList, setOrderList] = useState<Order[]>([]);
  const [supplierList, setSupplierList] = useState<Supplier[]>([]);
  const [clientList, setClientList] = useState<Client[]>([]);
  const [productList, setProductList] = useState<Product[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentOrderId, setCurrentOrderId] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const formRef = useRef<HTMLFormElement>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Order>({
    defaultValues: {
      orderID: "",
      supplierId: "",
      orderDate: "",
      totalAmount: 0,
      status: "",
      clientId: "",
      productIds: [],
    },
    resolver: yupResolver(OrderSchema),
  });

  const fetchAllData = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [ordersResponse, suppliersResponse, clientsResponse, productsResponse] =
        await Promise.all([
          axiosApi.get("/Order"),
          axiosApi.get("/Supplier"),
          axiosApi.get("/Client"),
          axiosApi.get("/Product"),
        ]);

      setOrderList((ordersResponse.data ?? []).map(normalizeOrder));
      setSupplierList((suppliersResponse.data ?? []).map(normalizeSupplier));
      setClientList((clientsResponse.data ?? []).map(normalizeClient));
      setProductList((productsResponse.data ?? []).map(normalizeProduct));
    } catch (error) {
      console.error("There was an error fetching the orders!", error);
      message.error("Erreur lors du chargement des commandes");
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
    const supplier = supplierList.find((s) => s.supplierId === supplierID);
    return supplier ? supplier.name : "Inconnu";
  };

  const getClientName = (clientID: string) => {
    const client = clientList.find((c: any) => c.clientID === clientID);
    return client ? `${client.firstname} ${client.lastName}` : "Inconnu";
  };

  const getProductNames = (productIds: string[]) => {
    return productIds
      .map((productId) => {
        const product = productList.find((p) => p.productID === productId);
        return product ? product.name : "Inconnu";
      })
      .join(", ");
  };

  const handleCreateOrder: SubmitHandler<Order> = async (data) => {
    const formattedData = {
      ...data,
      supplierId: data.supplierId,
      clientId: data.clientId,
      productIds: data.productIds,
      orderDate: new Date(data.orderDate),
    };

    try {
      const response = await createOrder(formattedData);
      const createdOrder = normalizeOrder(response ?? formattedData);

      setOrderList((prev) => [createdOrder, ...prev]);
      setIsModalVisible(false);
      message.success("Commande ajoutée avec succès");
      reset();
      setPage(1);
    } catch (error) {
      message.error("Erreur lors de l'ajout de la commande");
      console.error("Failed to create order:", error);
    }
  };

  const handleUpdateOrder: SubmitHandler<Order> = async (data) => {
    const formattedData = {
      ...data,
      supplierId: data.supplierId,
      clientId: data.clientId,
      productIds: data.productIds,
      orderDate: new Date(data.orderDate),
    };

    try {
      await updateOrder(currentOrderId, formattedData);
      const updatedOrder = normalizeOrder({ ...formattedData, orderID: currentOrderId });

      setOrderList((prev) =>
        prev.map((order) =>
          order.orderID === currentOrderId ? updatedOrder : order
        )
      );

      setIsModalVisible(false);
      setCurrentOrderId("");
      message.success("Commande mise à jour avec succès");
      reset();
    } catch (error) {
      message.error("Erreur lors de la mise à jour de la commande");
      console.error("Failed to update order:", error);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      setOrderList((prev) => prev.filter((order) => order.orderID !== orderId));
      message.success("Commande supprimée avec succès");
    } catch (error) {
      message.error("Erreur lors de la suppression de la commande");
      console.error("Failed to delete order:", error);
    }
  };

  const confirmDelete = (orderId: string) => {
    Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer cette commande ?",
      content: "Cette action ne peut pas être annulée.",
      okText: "Oui",
      okType: "danger",
      cancelText: "Non",
      onOk: () => handleDeleteOrder(orderId),
    });
  };

  const showCreateModal = () => {
    setIsEdit(false);
    setCurrentOrderId("");
    reset({
      orderID: "",
      supplierId: "",
      orderDate: new Date().toISOString().split("T")[0],
      totalAmount: 0,
      status: "",
      clientId: "",
      productIds: [],
    });
    setIsModalVisible(true);
  };

  const showEditModal = (order: Order) => {
    setIsEdit(true);
    setCurrentOrderId(order.orderID);
    reset({
      ...order,
      orderDate: order.orderDate
        ? new Date(order.orderDate).toISOString().split("T")[0]
        : "",
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
    setCurrentOrderId("");
  };

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return orderList.filter((order) => {
      const supplierName = getSupplierName(order.supplierId).toLowerCase();
      const clientName = getClientName(order.clientId).toLowerCase();
      const status = String(order.status ?? "").toLowerCase();
      const totalAmount = String(order.totalAmount ?? "");
      const products = getProductNames(order.productIds).toLowerCase();

      const matchesSearch =
        !term ||
        supplierName.includes(term) ||
        clientName.includes(term) ||
        status.includes(term) ||
        totalAmount.includes(term) ||
        products.includes(term);

      const matchesStatus =
        !statusFilter || String(order.status ?? "") === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orderList, searchTerm, statusFilter, supplierList, clientList, productList]);

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const totalAmount = useMemo(
    () =>
      filteredOrders.reduce(
        (sum, order) => sum + Number(order.totalAmount ?? 0),
        0
      ),
    [filteredOrders]
  );

  const deliveredCount = useMemo(
    () => filteredOrders.filter((order) => order.status === "Livré").length,
    [filteredOrders]
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
              <p className="text-sm font-medium text-gray-500">Commandes</p>
              <h1 className="mt-1 text-3xl font-bold text-gray-800">
                Gestion des commandes
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Interface rapide avec actualisation automatique chaque 60 secondes.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={showCreateModal}
                className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-600"
              >
                <FaShoppingCart />
                Ajouter une commande
              </button>

              <button
                onClick={() => fetchAllData(true)}
                className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
                Actualiser
              </button>

              {/* <OrderTest /> */}
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-green-400 p-5 text-white shadow-sm">
            <p className="text-sm opacity-90">Nombre de commandes</p>
            <h2 className="mt-2 text-3xl font-extrabold">
              {filteredOrders.length}
            </h2>
          </div>

          <div className="rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-400 p-5 text-white shadow-sm">
            <p className="text-sm opacity-90">Montant total</p>
            <h2 className="mt-2 text-3xl font-extrabold">
              {formatCurrency(totalAmount)}
            </h2>
          </div>

          <div className="rounded-3xl bg-gradient-to-r from-violet-500 to-purple-400 p-5 text-white shadow-sm">
            <p className="text-sm opacity-90">Commandes livrées</p>
            <h2 className="mt-2 text-3xl font-extrabold">{deliveredCount}</h2>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FaFilter className="text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-800">Recherche et filtre</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="relative lg:col-span-2">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher par fournisseur, client, statut ou produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="!rounded-2xl !border-gray-200 !py-3 !pl-11 !pr-4"
              />
            </div>

            <Select
              placeholder="Filtrer par statut"
              value={statusFilter || undefined}
              onChange={(value) => setStatusFilter(value || "")}
              allowClear
              className="w-full"
              options={ORDER_STATUSES.map((status) => ({
                value: status,
                label: status,
              }))}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Liste des commandes
              </h2>
              <p className="text-sm text-gray-500">
                {filteredOrders.length} commande(s) trouvée(s)
              </p>
            </div>

            {refreshing && (
              <span className="text-sm font-medium text-emerald-600">
                Actualisation...
              </span>
            )}
          </div>

          {paginatedOrders.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center text-gray-500">
              <FaBoxOpen className="mb-3 text-5xl text-emerald-500" />
              <h3 className="text-lg font-semibold text-gray-700">
                Aucune commande trouvée
              </h3>
              <p className="mt-1 text-sm">
                Essayez de changer la recherche ou le filtre.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {paginatedOrders.map((order, index) => (
                  <div
                    key={order.orderID || `order-${index}`}
                    className="flex min-h-[270px] flex-col justify-between rounded-3xl border border-gray-100 bg-gray-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-lg"
                  >
                    <div>
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">
                            Commande #{String(order.orderID).slice(0, 8)}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {formatDate(order.orderDate)}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                            order.status
                          )}`}
                        >
                          {order.status || "Sans statut"}
                        </span>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <FaTruck className="text-emerald-600" />
                          <span className="truncate">
                            {getSupplierName(order.supplierId)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <FaUser className="text-emerald-600" />
                          <span className="truncate">
                            {getClientName(order.clientId)}
                          </span>
                        </div>

                        <div className="flex items-start gap-2 text-gray-600">
                          <FaBoxOpen className="mt-0.5 text-emerald-600" />
                          <span className="line-clamp-2">
                            {getProductNames(order.productIds)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-gray-200 pt-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Montant total</p>
                          <p className="font-bold text-emerald-600">
                            {formatCurrency(order.totalAmount)}
                          </p>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          {order.productIds.length} produit(s)
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => showEditModal(order)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 py-2.5 font-medium text-blue-600 transition hover:bg-blue-100"
                        >
                          <FaEdit />
                          Modifier
                        </button>

                        <button
                          onClick={() => confirmDelete(order.orderID)}
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
                  total={filteredOrders.length}
                  onChange={(newPage) => setPage(newPage)}
                  showSizeChanger={false}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        title={isEdit ? "Modifier la commande" : "Ajouter une commande"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={isEdit ? "Modifier" : "Ajouter"}
        cancelText="Annuler"
      >
        <form
          onSubmit={handleSubmit((data) =>
            isEdit ? handleUpdateOrder(data) : handleCreateOrder(data)
          )}
          className="space-y-4"
          ref={formRef}
        >
          <Controller
            name="supplierId"
            control={control}
            render={({ field }) => (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Fournisseur
                </label>
                <select
                  {...field}
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                >
                  <option value="">Sélectionner un fournisseur</option>
                  {supplierList.map((supplier, index) => (
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
            name="clientId"
            control={control}
            render={({ field }) => (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Client
                </label>
                <select
                  {...field}
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                >
                  <option value="">Sélectionner un client</option>
                  {clientList.map((client: any, index) => (
                    <option
                      key={client.clientID || `client-${index}`}
                      value={client.clientID}
                    >
                      {client.firstname} {client.lastName}
                    </option>
                  ))}
                </select>
                {errors.clientId && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.clientId.message}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="orderDate"
            control={control}
            render={({ field }) => (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Date de commande
                </label>
                <input
                  {...field}
                  type="date"
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                />
                {errors.orderDate && (
                  <p className="mt-1 text-sm text-red-500">
                    {String(errors.orderDate.message)}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="totalAmount"
            control={control}
            render={({ field }) => (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Montant total
                </label>
                <input
                  {...field}
                  placeholder="Montant Total"
                  type="number"
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                />
                {errors.totalAmount && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.totalAmount.message}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Statut
                </label>
                <Select
                  {...field}
                  placeholder="Statut"
                  onChange={(value) => field.onChange(value)}
                  value={field.value || undefined}
                  options={ORDER_STATUSES.map((status) => ({
                    value: status,
                    label: status,
                  }))}
                />
                {errors.status && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.status.message}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="productIds"
            control={control}
            render={({ field }) => (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Produits
                </label>
                <Select
                  {...field}
                  showSearch
                  mode="multiple"
                  placeholder="Sélectionner des produits"
                  className="w-full"
                  onChange={(value) => field.onChange(value)}
                  value={field.value || []}
                  optionFilterProp="label"
                  options={productList.map((product, index) => ({
                    value: product.productID,
                    label: product.name || `Produit ${index + 1}`,
                  }))}
                />
                {errors.productIds && (
                  <p className="mt-1 text-sm text-red-500">
                    {String(errors.productIds.message)}
                  </p>
                )}
              </div>
            )}
          />
        </form>
      </Modal>
    </div>
  );
};

export default OrderManagementPage;