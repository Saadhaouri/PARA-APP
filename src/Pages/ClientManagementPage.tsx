// pages/ClientManagementPage.tsx

import { yupResolver } from "@hookform/resolvers/yup";
import { Input, Modal, Pagination, Select, Spin, message } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import * as yup from "yup";
import {
  createClient,
  deleteClient,
  getClients,
  updateClient,
} from "../Services/clientServices";
import { Client, CreateClient } from "../Types/ClientType";
import { IoPersonAddOutline, IoMailOutline, IoCallOutline } from "react-icons/io5";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaSyncAlt,
  FaMapMarkerAlt,
  FaUsers,
} from "react-icons/fa";

const clientSchema = yup.object().shape({
  firstname: yup.string().required("Le prénom est requis"),
  lastName: yup.string().required("Le nom est requis"),
  cin: yup.string().required("Le CIN est requis"),
  phoneNumber: yup.string().required("Le téléphone est requis"),
  email: yup.string().email("Email invalide").required("L'email est requis"),
  address: yup.object().shape({
    nr: yup.number().typeError("Le numéro est requis").required("Le numéro est requis"),
    street: yup.string().required("La rue est requise"),
    neighborhood: yup.string().required("Le quartier est requis"),
    city: yup.string().required("La ville est requise"),
  }),
});

const normalizeClient = (client: any): Client => ({
  ...client,
  clientID: String(client?.clientID ?? ""),
  firstname: String(client?.firstname ?? ""),
  lastName: String(client?.lastName ?? ""),
  cin: String(client?.cin ?? ""),
  phoneNumber: String(client?.phoneNumber ?? ""),
  email: String(client?.email ?? ""),
  address: {
    nr: Number(client?.address?.nr ?? 0),
    street: String(client?.address?.street ?? ""),
    neighborhood: String(client?.address?.neighborhood ?? ""),
    city: String(client?.address?.city ?? ""),
  },
});

const ClientManagementPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [clientList, setClientList] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [currentClientId, setCurrentClientId] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const formRef = useRef<HTMLFormElement>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateClient>({
    defaultValues: {
      firstname: "",
      lastName: "",
      cin: "",
      phoneNumber: "",
      email: "",
      address: {
        nr: 0,
        street: "",
        neighborhood: "",
        city: "",
      },
    },
    resolver: yupResolver(clientSchema),
  });

  const fetchClientsData = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getClients();
      setClientList((response.data ?? []).map(normalizeClient));
    } catch (error) {
      console.error("There was an error fetching the clients!", error);
      message.error("Erreur lors du chargement des clients");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClientsData();

    refreshIntervalRef.current = setInterval(() => {
      fetchClientsData(true);
    }, 60000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const handleCreateClient: SubmitHandler<CreateClient> = async (data) => {
    try {
      const response = await createClient(data);
      const createdClient = normalizeClient(response?.data ?? data);

      setClientList((prev) => [createdClient, ...prev]);
      setIsModalVisible(false);
      message.success("Client ajouté avec succès");
      reset();
      setPage(1);
    } catch (error) {
      message.error("Erreur lors de l'ajout du client");
      console.error("Failed to create client:", error);
    }
  };

  const handleUpdateClient: SubmitHandler<CreateClient> = async (data) => {
    try {
      const response = await updateClient(currentClientId, {
        ...data,
        clientID: currentClientId,
      });
      const updatedClient = normalizeClient(
        response?.data ?? { ...data, clientID: currentClientId }
      );

      setClientList((prev) =>
        prev.map((client) =>
          client.clientID === currentClientId ? updatedClient : client
        )
      );

      setIsModalVisible(false);
      setCurrentClientId("");
      message.success("Client mis à jour avec succès");
      reset();
    } catch (error) {
      message.error("Erreur lors de la mise à jour du client");
      console.error("Failed to update client:", error);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await deleteClient(clientId);
      setClientList((prev) => prev.filter((client) => client.clientID !== clientId));
      message.success("Client supprimé avec succès");
    } catch (error) {
      message.error("Erreur lors de la suppression du client");
      console.error("Failed to delete client:", error);
    }
  };

  const confirmDelete = (clientId: string) => {
    Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer ce client ?",
      content: "Cette action ne peut pas être annulée.",
      okText: "Oui",
      okType: "danger",
      cancelText: "Non",
      onOk: () => handleDeleteClient(clientId),
    });
  };

  const showModal = () => {
    setIsEdit(false);
    setCurrentClientId("");
    reset({
      firstname: "",
      lastName: "",
      cin: "",
      phoneNumber: "",
      email: "",
      address: {
        nr: 0,
        street: "",
        neighborhood: "",
        city: "",
      },
    });
    setIsModalVisible(true);
  };

  const showEditModal = (client: Client) => {
    setIsEdit(true);
    setCurrentClientId(client.clientID);
    reset({
      firstname: client.firstname,
      lastName: client.lastName,
      cin: client.cin,
      phoneNumber: client.phoneNumber,
      email: client.email,
      address: {
        nr: Number(client.address?.nr ?? 0),
        street: client.address?.street ?? "",
        neighborhood: client.address?.neighborhood ?? "",
        city: client.address?.city ?? "",
      },
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
    setCurrentClientId("");
  };

  const filteredClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return clientList.filter((client) => {
      const fullname = `${client.firstname} ${client.lastName}`.toLowerCase();
      const cin = String(client.cin ?? "").toLowerCase();
      const phone = String(client.phoneNumber ?? "").toLowerCase();
      const email = String(client.email ?? "").toLowerCase();
      const city = String(client.address?.city ?? "").toLowerCase();
      const street = String(client.address?.street ?? "").toLowerCase();
      const neighborhood = String(client.address?.neighborhood ?? "").toLowerCase();

      const matchesSearch =
        !term ||
        fullname.includes(term) ||
        cin.includes(term) ||
        phone.includes(term) ||
        email.includes(term) ||
        city.includes(term) ||
        street.includes(term) ||
        neighborhood.includes(term);

      const matchesCity =
        !selectedCity || String(client.address?.city ?? "") === selectedCity;

      return matchesSearch && matchesCity;
    });
  }, [clientList, searchTerm, selectedCity]);

  const paginatedClients = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCity]);

  const cityOptions = useMemo(() => {
    const uniqueCities = Array.from(
      new Set(clientList.map((client) => String(client.address?.city ?? "").trim()).filter(Boolean))
    );

    return uniqueCities.map((city) => ({
      label: city,
      value: city,
    }));
  }, [clientList]);

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
              <p className="text-sm font-medium text-gray-500">Clients</p>
              <h1 className="mt-1 text-3xl font-bold text-gray-800">
                Gestion des clients
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
                <IoPersonAddOutline />
                Ajouter client
              </button>

              <button
                onClick={() => fetchClientsData(true)}
                className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
                Actualiser
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-green-400 p-5 text-white shadow-sm">
            <p className="text-sm opacity-90">Nombre de clients</p>
            <h2 className="mt-2 text-3xl font-extrabold">{clientList.length}</h2>
          </div>

          <div className="rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-400 p-5 text-white shadow-sm">
            <p className="text-sm opacity-90">Après filtre</p>
            <h2 className="mt-2 text-3xl font-extrabold">{filteredClients.length}</h2>
          </div>

          <div className="rounded-3xl bg-gradient-to-r from-violet-500 to-purple-400 p-5 text-white shadow-sm">
            <p className="text-sm opacity-90">Villes</p>
            <h2 className="mt-2 text-3xl font-extrabold">{cityOptions.length}</h2>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="relative lg:col-span-2">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, CIN, téléphone, email ou adresse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="!rounded-2xl !border-gray-200 !py-3 !pl-11 !pr-4"
              />
            </div>

            <Select
              placeholder="Filtrer par ville"
              allowClear
              value={selectedCity || undefined}
              onChange={(value) => setSelectedCity(value || "")}
              options={cityOptions}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Liste des clients</h2>
              <p className="text-sm text-gray-500">
                {filteredClients.length} client(s) trouvé(s)
              </p>
            </div>

            {refreshing && (
              <span className="text-sm font-medium text-emerald-600">
                Actualisation...
              </span>
            )}
          </div>

          {paginatedClients.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center text-gray-500">
              <FaUsers className="mb-3 text-5xl text-emerald-500" />
              <h3 className="text-lg font-semibold text-gray-700">
                Aucun client trouvé
              </h3>
              <p className="mt-1 text-sm">
                Essayez de modifier la recherche ou le filtre.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {paginatedClients.map((client, index) => (
                  <div
                    key={client.clientID || `client-${index}`}
                    className="flex min-h-[250px] flex-col justify-between rounded-3xl border border-gray-100 bg-gray-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-lg"
                  >
                    <div>
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">
                            {client.firstname} {client.lastName}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            CIN: {client.cin || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <IoCallOutline className="text-emerald-600" />
                          <span>{client.phoneNumber || "-"}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <IoMailOutline className="text-emerald-600" />
                          <span className="truncate">{client.email || "-"}</span>
                        </div>

                        <div className="flex items-start gap-2 text-gray-600">
                          <FaMapMarkerAlt className="mt-0.5 text-emerald-600" />
                          <span>
                            {`${client.address?.nr ?? 0} ${client.address?.street ?? ""}, ${
                              client.address?.neighborhood ?? ""
                            }, ${client.address?.city ?? ""}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-gray-200 pt-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => showEditModal(client)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 py-2.5 font-medium text-blue-600 transition hover:bg-blue-100"
                        >
                          <FaEdit />
                          Modifier
                        </button>

                        <button
                          onClick={() => confirmDelete(client.clientID)}
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
                  total={filteredClients.length}
                  onChange={(newPage) => setPage(newPage)}
                  showSizeChanger={false}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        title={isEdit ? "Modifier le client" : "Ajouter un client"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={isEdit ? "Modifier" : "Ajouter"}
        cancelText="Annuler"
      >
        <form
          onSubmit={handleSubmit((data) =>
            isEdit ? handleUpdateClient(data) : handleCreateClient(data)
          )}
          className="space-y-4"
          ref={formRef}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Controller
              name="firstname"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Prénom
                  </label>
                  <input
                    {...field}
                    placeholder="Prénom"
                    className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                  />
                  {errors.firstname && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.firstname.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Nom
                  </label>
                  <input
                    {...field}
                    placeholder="Nom"
                    className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              name="cin"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    CIN
                  </label>
                  <input
                    {...field}
                    placeholder="CIN"
                    className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                  />
                  {errors.cin && (
                    <p className="mt-1 text-sm text-red-500">{errors.cin.message}</p>
                  )}
                </div>
              )}
            />

            <Controller
              name="phoneNumber"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Téléphone
                  </label>
                  <input
                    {...field}
                    placeholder="Téléphone"
                    className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.phoneNumber.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    {...field}
                    placeholder="Email"
                    className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
              )}
            />

            <Controller
              name="address.nr"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Numéro
                  </label>
                  <input
                    {...field}
                    type="number"
                    placeholder="Numéro"
                    className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                  />
                  {errors.address?.nr && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.address.nr.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              name="address.street"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Rue
                  </label>
                  <input
                    {...field}
                    placeholder="Rue"
                    className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                  />
                  {errors.address?.street && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.address.street.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              name="address.neighborhood"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Quartier
                  </label>
                  <input
                    {...field}
                    placeholder="Quartier"
                    className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                  />
                  {errors.address?.neighborhood && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.address.neighborhood.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              name="address.city"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Ville
                  </label>
                  <input
                    {...field}
                    placeholder="Ville"
                    className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                  />
                  {errors.address?.city && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.address.city.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClientManagementPage;