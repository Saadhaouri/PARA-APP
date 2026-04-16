import { yupResolver } from "@hookform/resolvers/yup";
import { Input, Modal, Pagination, Spin, message } from "antd";
import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import * as yup from "yup";
import {
  createSupplier,
  deleteSupplier, 
  updateSupplier,
} from "../Services/supplierServices";
import {
  IoPersonAddOutline,
  IoSearchOutline,
  IoCallOutline,
  IoMailOutline,
  IoPersonOutline,
} from "react-icons/io5";
import { FaEdit, FaTrash, FaSyncAlt, FaTruckLoading } from "react-icons/fa";

type SupplierBase = {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
};

type Supplier = SupplierBase & {
  supplierId: string;
};

type AddSupplier = SupplierBase & {
  supplierId?: string;
};

const supplierSchema = yup.object({
  supplierId: yup.string().optional(),
  name: yup.string().required("Le nom est requis"),
  contactPerson: yup.string().required("Le contact est requis"),
  email: yup
    .string()
    .email("Email invalide")
    .required("L'email est requis"),
  phone: yup.string().required("Téléphone est requis"),
});

const normalizeSupplier = (supplier: any): Supplier => ({
  supplierId: String(supplier?.supplierId ?? ""),
  name: String(supplier?.name ?? ""),
  contactPerson: String(supplier?.contactPerson ?? ""),
  email: String(supplier?.email ?? ""),
  phone: String(supplier?.phone ?? ""),
});

const SupplierManagementPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [supplierList, setSupplierList] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const formRef = useRef<HTMLFormElement>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddSupplier>({
    defaultValues: {
      supplierId: "",
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
    },
    resolver: yupResolver(supplierSchema),
  });

  const fetchSuppliers = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get("http://localhost:5133/Supplier");
      const normalizedSuppliers = (response.data ?? []).map(normalizeSupplier);
      setSupplierList(normalizedSuppliers);
    } catch (error) {
      console.error("There was an error fetching the suppliers!", error);
      message.error("Erreur lors du chargement des fournisseurs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();

    refreshIntervalRef.current = setInterval(() => {
      fetchSuppliers(true);
    }, 60000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const handleCreateSupplier: SubmitHandler<AddSupplier> = async (data) => {
    try {
      const response = await createSupplier({
        ...data,
        supplierId: data.supplierId ?? "",
      });
      const createdSupplier = normalizeSupplier(response?.data ?? data);

      setSupplierList((prev) => [createdSupplier, ...prev]);
      setIsModalVisible(false);
      message.success("Fournisseur ajouté avec succès");
      reset();
      setPage(1);
    } catch (error) {
      message.error("Erreur lors de l'ajout du fournisseur");
      console.error("Failed to create supplier:", error);
    }
  };

  const handleUpdateSupplier: SubmitHandler<AddSupplier> = async (data) => {
    try {
      const currentId = (formRef.current?.dataset.supplierId as string) || "";
      const response: any = await updateSupplier(currentId, {
        ...data,
        supplierId: currentId,
      });
      const updatedSupplier = normalizeSupplier(
        response?.data ?? { ...data, supplierId: currentId }
      );

      setSupplierList((prev) =>
        prev.map((supplier) =>
          supplier.supplierId === currentId ? updatedSupplier : supplier
        )
      );

      setIsModalVisible(false);
      message.success("Fournisseur mis à jour avec succès");
      reset();
    } catch (error) {
      message.error("Erreur lors de la mise à jour du fournisseur");
      console.error("Failed to update supplier:", error);
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    try {
      await deleteSupplier(supplierId);
      setSupplierList((prev) =>
        prev.filter((supplier) => supplier.supplierId !== supplierId)
      );
      message.success("Fournisseur supprimé avec succès");
    } catch (error) {
      message.error("Erreur lors de la suppression du fournisseur");
      console.error("Failed to delete supplier:", error);
    }
  };

  const confirmDelete = (supplierId: string) => {
    Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer ce fournisseur ?",
      content: "Cette action ne peut pas être annulée.",
      okText: "Oui",
      okType: "danger",
      cancelText: "Non",
      onOk: () => handleDeleteSupplier(supplierId),
    });
  };

  const showModal = () => {
    setIsEdit(false);
    reset({
      supplierId: "",
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
    });
    setIsModalVisible(true);
  };

  const showEditModal = (supplier: Supplier) => {
    setIsEdit(true);
    reset({
      supplierId: supplier.supplierId,
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
    });
    setIsModalVisible(true);

    setTimeout(() => {
      if (formRef.current) {
        formRef.current.dataset.supplierId = supplier.supplierId;
      }
    }, 0);
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
    reset({
      supplierId: "",
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
    });
  };

  const filteredSuppliers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return supplierList.filter((supplier) => {
      const name = String(supplier.name ?? "").toLowerCase();
      const contactPerson = String(supplier.contactPerson ?? "").toLowerCase();
      const email = String(supplier.email ?? "").toLowerCase();
      const phone = String(supplier.phone ?? "").toLowerCase();

      return (
        !term ||
        name.includes(term) ||
        contactPerson.includes(term) ||
        email.includes(term) ||
        phone.includes(term)
      );
    });
  }, [supplierList, searchTerm]);

  const paginatedSuppliers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSuppliers.slice(start, start + pageSize);
  }, [filteredSuppliers, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const supplierCount = supplierList.length;

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
              <p className="text-sm font-medium text-gray-500">Partenaires</p>
              <h1 className="mt-1 text-3xl font-bold text-gray-800">
                Gestion des fournisseurs
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
                Ajouter fournisseur
              </button>

              <button
                onClick={() => fetchSuppliers(true)}
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
            <p className="text-sm opacity-90">Nombre total</p>
            <h2 className="mt-2 text-3xl font-extrabold">{supplierCount}</h2>
          </div>

          <div className="rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-400 p-5 text-white shadow-sm">
            <p className="text-sm opacity-90">Après recherche</p>
            <h2 className="mt-2 text-3xl font-extrabold">
              {filteredSuppliers.length}
            </h2>
          </div>

          <div className="rounded-3xl bg-gradient-to-r from-violet-500 to-purple-400 p-5 text-white shadow-sm">
            <p className="text-sm opacity-90">État</p>
            <h2 className="mt-2 text-2xl font-extrabold">
              {refreshing ? "Actualisation..." : "Synchronisé"}
            </h2>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="relative">
            <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, contact, email ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="!rounded-2xl !border-gray-200 !py-3 !pl-11 !pr-4"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Liste des fournisseurs
              </h2>
              <p className="text-sm text-gray-500">
                {filteredSuppliers.length} fournisseur(s) trouvé(s)
              </p>
            </div>

            {refreshing && (
              <span className="text-sm font-medium text-emerald-600">
                Actualisation...
              </span>
            )}
          </div>

          {paginatedSuppliers.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center text-gray-500">
              <FaTruckLoading className="mb-3 text-5xl text-emerald-500" />
              <h3 className="text-lg font-semibold text-gray-700">
                Aucun fournisseur trouvé
              </h3>
              <p className="mt-1 text-sm">
                Essayez de modifier votre recherche.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {paginatedSuppliers.map((supplier, index) => (
                  <div
                    key={supplier.supplierId || `supplier-${index}`}
                    className="flex min-h-[250px] flex-col justify-between rounded-3xl border border-gray-100 bg-gray-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-lg"
                  >
                    <div>
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-bold text-gray-800">
                            {supplier.name || "Sans nom"}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Fournisseur partenaire
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <IoPersonOutline className="text-emerald-600" />
                          <span className="truncate">
                            {supplier.contactPerson || "-"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <IoMailOutline className="text-emerald-600" />
                          <span className="truncate">{supplier.email || "-"}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <IoCallOutline className="text-emerald-600" />
                          <span>{supplier.phone || "-"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-gray-200 pt-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => showEditModal(supplier)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 py-2.5 font-medium text-blue-600 transition hover:bg-blue-100"
                        >
                          <FaEdit />
                          Modifier
                        </button>

                        <button
                          onClick={() => confirmDelete(supplier.supplierId)}
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
                  total={filteredSuppliers.length}
                  onChange={(newPage) => setPage(newPage)}
                  showSizeChanger={false}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        title={isEdit ? "Modifier le fournisseur" : "Ajouter un fournisseur"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={isEdit ? "Modifier" : "Ajouter"}
        cancelText="Annuler"
      >
        <form
          onSubmit={handleSubmit((data) =>
            isEdit ? handleUpdateSupplier(data) : handleCreateSupplier(data)
          )}
          className="space-y-4"
          ref={formRef}
        >
          <Controller
            name="supplierId"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="hidden"
              />
            )}
          />

          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nom du fournisseur
                </label>
                <input
                  {...field}
                  placeholder="Nom du fournisseur"
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
            )}
          />

          <Controller
            name="contactPerson"
            control={control}
            render={({ field }) => (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Contact
                </label>
                <input
                  {...field}
                  placeholder="Nom du contact"
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                />
                {errors.contactPerson && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.contactPerson.message}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  {...field}
                  placeholder="Adresse email"
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-emerald-400"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            )}
          />

          <Controller
            name="phone"
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
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>
            )}
          />
        </form>
      </Modal>
    </div>
  );
};

export default SupplierManagementPage;