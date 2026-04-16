import {
  Input as AntInput,
  Button,
  Card,
  Modal,
  Select,
  message,
  Pagination,
  Spin,
} from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import { FaPlus, FaSearch, FaSyncAlt, FaWallet } from "react-icons/fa";
import axiosApi from "../Config/axiosAPI";
import { Client } from "../Types/ClientType";
import { Debt } from "../Types/DebtType";
import Product from "../Types/ProductType";

const formatDateForInput = (date: string): string => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR");
};

const formatCurrency = (value: number | null | undefined): string =>
  `${Number(value ?? 0).toFixed(2)} MAD`;

const normalizeDebt = (debt: any): Debt => ({
  debtID: String(debt?.debtID ?? ""),
  clientID: String(debt?.clientID ?? ""),
  dateDebt: String(debt?.dateDebt ?? ""),
  lastDatePayee: String(debt?.lastDatePayee ?? ""),
  total: Number(debt?.total ?? 0),
  status: String(debt?.status ?? ""),
  avance: Number(debt?.avance ?? 0),
  productIds: Array.isArray(debt?.productIds)
    ? debt.productIds.map((id: any) => String(id))
    : [],
  rest: Number(debt?.rest ?? Number(debt?.total ?? 0) - Number(debt?.avance ?? 0)),
});

const normalizeClient = (client: any): Client => ({
  ...client,
  clientID: String(client?.clientID ?? ""),
  firstname: String(client?.firstname ?? ""),
  lastName: String(client?.lastName ?? ""),
});

const normalizeProduct = (product: any): Product => ({
  ...product,
  productID: String(product?.productID ?? ""),
  name: String(product?.name ?? ""),
});

const DebtPage = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [debtList, setDebtList] = useState<Debt[]>([]);
  const [clientList, setClientList] = useState<Client[]>([]);
  const [productList, setProductList] = useState<Product[]>([]);

  const [selectedClientID, setSelectedClientID] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDebtId, setCurrentDebtId] = useState<string>("");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Debt>({
    defaultValues: {
      debtID: "",
      clientID: "",
      dateDebt: "",
      lastDatePayee: "",
      total: 0,
      status: "",
      avance: 0,
      productIds: [],
    },
  });

  const fetchAllData = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [debtsResponse, clientsResponse, productsResponse] = await Promise.all([
        axiosApi.get<Debt[]>("/Debt"),
        axiosApi.get<Client[]>("/Client"),
        axiosApi.get<Product[]>("/Product"),
      ]);

      setDebtList((debtsResponse.data ?? []).map(normalizeDebt));
      setClientList((clientsResponse.data ?? []).map(normalizeClient));
      setProductList((productsResponse.data ?? []).map(normalizeProduct));
    } catch (error) {
      console.error("Error fetching debt page data:", error);
      message.error("Erreur lors du chargement des dettes");
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
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, []);

  const getClientName = (clientId: string): string => {
    const client = clientList.find((c) => c.clientID === clientId);
    return client ? `${client.firstname} ${client.lastName}` : "Inconnu";
  };

  const getProductNames = (productIds: string[]): string => {
    return productIds
      .map((productId) => {
        const product = productList.find((p) => p.productID === productId);
        return product ? product.name : "Inconnu";
      })
      .join(", ");
  };

  const filteredDebtList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return debtList.filter((debt) => {
      const clientName = getClientName(debt.clientID).toLowerCase();
      const status = String(debt.status ?? "").toLowerCase();
      const products = getProductNames(debt.productIds || []).toLowerCase();
      const total = String(debt.total ?? "");
      const avance = String(debt.avance ?? "");
      const rest = String(
        Number(debt.rest ?? Number(debt.total ?? 0) - Number(debt.avance ?? 0))
      );

      const matchesClient =
        !selectedClientID || debt.clientID === selectedClientID;

      const matchesStatus =
        !selectedStatus || String(debt.status ?? "") === selectedStatus;

      const matchesSearch =
        !term ||
        clientName.includes(term) ||
        status.includes(term) ||
        products.includes(term) ||
        total.includes(term) ||
        avance.includes(term) ||
        rest.includes(term);

      return matchesClient && matchesStatus && matchesSearch;
    });
  }, [debtList, selectedClientID, selectedStatus, searchTerm, clientList, productList]);

  const paginatedDebts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDebtList.slice(start, start + itemsPerPage);
  }, [filteredDebtList, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClientID, selectedStatus, searchTerm]);

  const handleCreateDebt = async (data: Debt) => {
    try {
      const response = await axiosApi.post("/Debt", data);
      const createdDebt = normalizeDebt(response.data ?? data);

      setDebtList((prev) => [createdDebt, ...prev]);
      message.success("Dette ajoutée avec succès");
      setIsModalVisible(false);
      reset();
      setCurrentPage(1);
    } catch (error) {
      message.error("Erreur lors de la création de la dette");
      console.error("Failed to create debt:", error);
    }
  };

  const handleUpdateDebt = async (data: Debt) => {
    try {
      const response = await axiosApi.put(`/Debt/${currentDebtId}`, data);
      const updatedDebt = normalizeDebt(response.data ?? { ...data, debtID: currentDebtId });

      setDebtList((prev) =>
        prev.map((debt) => (debt.debtID === currentDebtId ? updatedDebt : debt))
      );

      message.success("Dette mise à jour avec succès");
      setIsModalVisible(false);
      setCurrentDebtId("");
    } catch (error) {
      message.error("Erreur lors de la mise à jour de la dette");
      console.error("Failed to update debt:", error);
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    try {
      await axiosApi.delete(`/Debt/${debtId}`);
      setDebtList((prev) => prev.filter((debt) => debt.debtID !== debtId));
      message.success("Dette supprimée avec succès");
    } catch (error) {
      message.error("Erreur lors de la suppression de la dette");
      console.error("Failed to delete debt:", error);
    }
  };

  const confirmDeleteDebt = (debtId: string) => {
    Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer cette dette ?",
      content: "Cette action ne peut pas être annulée.",
      okText: "Oui",
      okType: "danger",
      cancelText: "Non",
      onOk: () => handleDeleteDebt(debtId),
    });
  };

  const showModal = (debt?: Debt) => {
    if (debt) {
      setIsEdit(true);
      setCurrentDebtId(debt.debtID);
      reset({
        debtID: debt.debtID,
        clientID: debt.clientID,
        dateDebt: formatDateForInput(debt.dateDebt),
        lastDatePayee: formatDateForInput(debt.lastDatePayee),
        total: Number(debt.total ?? 0),
        status: debt.status,
        avance: Number(debt.avance ?? 0),
        productIds: debt.productIds || [],
      });
    } else {
      setIsEdit(false);
      setCurrentDebtId("");
      reset({
        debtID: "",
        clientID: "",
        dateDebt: "",
        lastDatePayee: "",
        total: 0,
        status: "",
        avance: 0,
        productIds: [],
      });
    }
    setIsModalVisible(true);
  };

  const totalPaidDebts = useMemo(
    () => filteredDebtList.filter((debt) => debt.status === "payee").length,
    [filteredDebtList]
  );

  const totalUnpaidDebts = useMemo(
    () => filteredDebtList.filter((debt) => debt.status === "non_payee").length,
    [filteredDebtList]
  );

  const totalRemaining = useMemo(
    () =>
      filteredDebtList.reduce(
        (sum, debt) =>
          sum + Number(debt.rest ?? Number(debt.total ?? 0) - Number(debt.avance ?? 0)),
        0
      ),
    [filteredDebtList]
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
              <p className="text-sm font-medium text-gray-500">Finances</p>
              <h1 className="mt-1 text-3xl font-bold text-gray-800">
                Gestion des dettes
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Interface légère avec actualisation automatique chaque 60 secondes.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                onClick={() => showModal()}
              >
                <FaPlus />
                Ajouter une dette
              </button>

              <button
                onClick={() => fetchAllData(true)}
                className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
                Actualiser
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="!rounded-3xl !border-0 !shadow-sm" styles={{ body: { padding: 20 } }}>
            <div className="border-l-4 border-green-500 pl-4">
              <p className="text-sm text-gray-500">Dettes payées</p>
              <p className="mt-2 text-3xl font-extrabold text-gray-800">{totalPaidDebts}</p>
            </div>
          </Card>

          <Card className="!rounded-3xl !border-0 !shadow-sm" styles={{ body: { padding: 20 } }}>
            <div className="border-l-4 border-red-500 pl-4">
              <p className="text-sm text-gray-500">Dettes non payées</p>
              <p className="mt-2 text-3xl font-extrabold text-gray-800">{totalUnpaidDebts}</p>
            </div>
          </Card>

          <Card className="!rounded-3xl !border-0 !shadow-sm" styles={{ body: { padding: 20 } }}>
            <div className="border-l-4 border-orange-500 pl-4">
              <p className="text-sm text-gray-500">Total restant</p>
              <p className="mt-2 text-3xl font-extrabold text-gray-800">
                {formatCurrency(totalRemaining)}
              </p>
            </div>
          </Card>
        </div>

        <div className="mb-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <AntInput
                placeholder="Rechercher par client, statut, produits ou montant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="!rounded-2xl !border-gray-200 !py-3 !pl-11 !pr-4"
              />
            </div>

            <Select
              showSearch
              placeholder="Filtrer par client"
              allowClear
              value={selectedClientID || undefined}
              onChange={(value) => setSelectedClientID(value || null)}
              options={clientList.map((client: Client) => ({
                label: `${client.firstname} ${client.lastName}`,
                value: client.clientID,
              }))}
              filterOption={(input, option) =>
                (option?.label as string).toLowerCase().includes(input.toLowerCase())
              }
            />

            <Select
              placeholder="Filtrer par statut"
              allowClear
              value={selectedStatus || undefined}
              onChange={(value) => setSelectedStatus(value || "")}
              options={[
                { label: "Payée", value: "payee" },
                { label: "Non Payée", value: "non_payee" },
              ]}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Liste des dettes</h2>
              <p className="text-sm text-gray-500">
                {filteredDebtList.length} dette(s) trouvée(s)
              </p>
            </div>

            {refreshing && (
              <span className="text-sm font-medium text-emerald-600">
                Actualisation...
              </span>
            )}
          </div>

          {paginatedDebts.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center text-gray-500">
              <FaWallet className="mb-3 text-5xl text-emerald-500" />
              <h3 className="text-lg font-semibold text-gray-700">
                Aucune dette trouvée
              </h3>
              <p className="mt-1 text-sm">
                Essayez de modifier votre recherche ou vos filtres.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {paginatedDebts.map((debt, index) => {
                  const rest =
                    Number(debt.rest ?? Number(debt.total ?? 0) - Number(debt.avance ?? 0));

                  return (
                    <div
                      key={debt.debtID || `debt-${index}`}
                      className="flex min-h-[280px] flex-col justify-between rounded-3xl border border-gray-100 bg-gray-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-lg"
                    >
                      <div>
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">
                              {getClientName(debt.clientID)}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Dette #{String(debt.debtID).slice(0, 8)}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${
                              debt.status === "payee" ? "bg-green-500" : "bg-red-500"
                            }`}
                          >
                            {debt.status === "payee" ? "Payée" : "Non Payée"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-2xl bg-white p-3">
                            <p className="text-gray-500">Date dette</p>
                            <p className="mt-1 font-semibold text-gray-800">
                              {formatDate(debt.dateDebt)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-3">
                            <p className="text-gray-500">Dernier paiement</p>
                            <p className="mt-1 font-semibold text-gray-800">
                              {formatDate(debt.lastDatePayee)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-3">
                            <p className="text-gray-500">Total</p>
                            <p className="mt-1 font-semibold text-gray-800">
                              {formatCurrency(debt.total)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-3">
                            <p className="text-gray-500">Avance</p>
                            <p className="mt-1 font-semibold text-gray-800">
                              {formatCurrency(debt.avance)}
                            </p>
                          </div>

                          <div className="col-span-2 rounded-2xl bg-white p-3">
                            <p className="text-gray-500">Reste</p>
                            <p className="mt-1 font-bold text-orange-600">
                              {formatCurrency(rest)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-white p-3">
                          <p className="text-sm text-gray-500">Produits</p>
                          <p className="mt-1 text-sm font-medium text-gray-800">
                            {getProductNames(debt.productIds || []) || "Aucun produit"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-gray-200 pt-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => showModal(debt)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 py-2.5 font-medium text-blue-600 transition hover:bg-blue-100"
                          >
                            <AiOutlineEdit />
                            Modifier
                          </button>

                          <button
                            onClick={() => confirmDeleteDebt(debt.debtID)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-2.5 font-medium text-red-600 transition hover:bg-red-100"
                          >
                            <AiOutlineDelete />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-center">
                <Pagination
                  current={currentPage}
                  pageSize={itemsPerPage}
                  total={filteredDebtList.length}
                  onChange={(page) => setCurrentPage(page)}
                  showSizeChanger={false}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        title={isEdit ? "Modifier la Dette" : "Ajouter une Dette"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <form onSubmit={handleSubmit(isEdit ? handleUpdateDebt : handleCreateDebt)}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Client</label>
              <Controller
                name="clientID"
                control={control}
                rules={{ required: "Le client est requis" }}
                render={({ field }) => (
                  <Select
                    showSearch
                    style={{ width: "100%" }}
                    {...field}
                    options={clientList.map((client: Client) => ({
                      label: `${client.firstname} ${client.lastName}`,
                      value: client.clientID,
                    }))}
                    filterOption={(input, option) =>
                      (option?.label as string)
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                )}
              />
              {errors.clientID && (
                <p className="mt-1 text-sm text-red-500">{errors.clientID.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Date de la Dette
              </label>
              <Controller
                name="dateDebt"
                control={control}
                rules={{ required: "La date de la dette est requise" }}
                render={({ field }) => (
                  <AntInput type="date" {...field} value={field.value} />
                )}
              />
              {errors.dateDebt && (
                <p className="mt-1 text-sm text-red-500">{errors.dateDebt.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Date du Dernier Paiement
              </label>
              <Controller
                name="lastDatePayee"
                control={control}
                render={({ field }) => (
                  <AntInput type="date" {...field} value={field.value} />
                )}
              />
              {errors.lastDatePayee && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.lastDatePayee.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Total</label>
              <Controller
                name="total"
                control={control}
                rules={{ required: "Le total est requis" }}
                render={({ field }) => <AntInput type="number" {...field} />}
              />
              {errors.total && (
                <p className="mt-1 text-sm text-red-500">{errors.total.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Statut</label>
              <Controller
                name="status"
                control={control}
                rules={{ required: "Le statut est requis" }}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Sélectionnez le statut"
                    style={{ width: "100%" }}
                    options={[
                      { label: "Payé", value: "payee" },
                      { label: "Non Payé", value: "non_payee" },
                    ]}
                  />
                )}
              />
              {errors.status && (
                <p className="mt-1 text-sm text-red-500">{errors.status.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Avance</label>
              <Controller
                name="avance"
                control={control}
                rules={{ required: "L'avance est requise" }}
                render={({ field }) => <AntInput type="number" {...field} />}
              />
              {errors.avance && (
                <p className="mt-1 text-sm text-red-500">{errors.avance.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">Produits</label>
              <Controller
                name="productIds"
                control={control}
                render={({ field }) => (
                  <Select
                    mode="multiple"
                    style={{ width: "100%" }}
                    {...field}
                    options={productList.map((product: Product) => ({
                      label: product.name,
                      value: product.productID,
                    }))}
                  />
                )}
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <Button type="primary" htmlType="submit" className="!bg-emerald-500 hover:!bg-emerald-600">
              {isEdit ? "Mettre à Jour la Dette" : "Créer la Dette"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DebtPage;