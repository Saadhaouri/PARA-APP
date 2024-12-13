import {
  Input as AntInput,
  Button,
  Card,
  Modal,
  Select,
  Table,
  message,
} from "antd";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import { FaPlus } from "react-icons/fa";
import axiosApi from "../Config/axiosAPI";
import { Client } from "../Types/ClientType";
import { Debt } from "../Types/DebtType";
import Product from "../Types/ProductType";

const formatDateForInput = (date: string): string => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};
const DebtPage = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [debtList, setDebtList] = useState<Debt[]>([]);
  const [clientList, setClientList] = useState<Client[]>([]);
  const [productList, setProductList] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  // const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);l
  const [filteredDebtList, setFilteredDebtList] = useState<Debt[]>([]);
  const [selectedClientID, setSelectedClientID] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchDebts = async () => {
      try {
        const response = await axiosApi.get<Debt[]>("/Debt");
        setDebtList(response.data);
      } catch (error) {
        console.error("Error fetching debts:", error);
      }
    };

    const fetchClients = async () => {
      try {
        const response = await axiosApi.get<Client[]>("/Client");
        setClientList(response.data);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await axiosApi.get<Product[]>("/Product");
        setProductList(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    if (selectedClientID) {
      const filtered = debtList.filter(
        (debt) => debt.clientID === selectedClientID
      );
      setFilteredDebtList(filtered);
    } else {
      setFilteredDebtList(debtList);
    }

    fetchDebts();
    fetchClients();
    fetchProducts();

    const intervalId = setInterval(() => {
      fetchDebts();
      fetchClients();
      fetchProducts();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [debtList, selectedClientID]);

  const handleCreateDebt = async (data: Debt) => {
    try {
      await axiosApi.post("/Debt", data);
      message.success("Debt added successfully!");
      setIsModalVisible(false);
      reset();
    } catch (error) {
      message.error("Error creating debt.");
      console.error("Failed to create debt:", error);
    }
  };

  const handleUpdateDebt = async (data: Debt) => {
    try {
      await axiosApi.put(`/Debt/${data.debtID}`, data);
      message.success("Debt updated successfully!");
      setIsModalVisible(false);
    } catch (error) {
      message.error("Error updating debt.");
      console.error("Failed to update debt:", error);
    }
  };

  const showModal = (debt?: Debt) => {
    if (debt) {
      setIsEdit(true);
      // setSelectedDebt(debt);
      reset({
        debtID: debt.debtID,
        clientID: debt.clientID,
        dateDebt: formatDateForInput(debt.dateDebt),
        lastDatePayee: formatDateForInput(debt.lastDatePayee),
        total: debt.total,
        status: debt.status,
        avance: debt.avance,
        productIds: debt.productIds || [],
      });
    } else {
      setIsEdit(false);
      // setSelectedDebt(null);
      reset({
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

  const totalPaidDebts = filteredDebtList.filter(
    (debt) => debt.status === "payee"
  ).length;
  const totalUnpaidDebts = filteredDebtList.filter(
    (debt) => debt.status === "non_payee"
  ).length;
  const totalRemaining = filteredDebtList.reduce(
    (sum, debt) => sum + (debt.total - debt.avance),
    0
  );

  const getClientName = (clientId: string): string => {
    const client = clientList.find((c) => c.clientID === clientId);
    return client ? `${client.firstname} ${client.lastName}` : "Unknown";
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const handleClientFilter = (clientId: string | null) => {
    setSelectedClientID(clientId);
  };

  const handleDeleteDebt = async (debtId: string) => {
    try {
      await axiosApi.delete(`/Debt/${debtId}`);
      message.success("Dette supprimée avec succès");
      const debtsResponse = await axiosApi.get("/Debt");
      setDebtList(debtsResponse.data);
    } catch (error) {
      message.error("Erreur lors de la suppression de la dette");
      console.error("Failed to delete debt:", error);
    }
  };

  const confirmDeleteDebt = (debtId: string) => {
    Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer cette dette?",
      content: "Cette action ne peut pas être annulée.",
      okText: "Oui",
      okType: "danger",
      cancelText: "Non",
      onOk: () => handleDeleteDebt(debtId),
    });
  };

  const columns = [
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <div className="flex justify-center items-center space-x-4 p-2">
          <AiOutlineEdit
            className="text-blue-500 text-xl cursor-pointer hover:text-blue-700 transition duration-200"
            onClick={() => showModal(record)}
          />
          <AiOutlineDelete
            className="text-red-500 text-xl cursor-pointer hover:text-red-700 transition duration-200"
            onClick={() => confirmDeleteDebt(record.debtID)}
          />
        </div>
      ),
    },
    {
      title: "Client",
      dataIndex: "clientID",
      key: "clientID",
      render: (clientId: string) => getClientName(clientId),
    },
    {
      title: "Date de Dette",
      dataIndex: "dateDebt",
      key: "dateDebt",
      render: (dateDebt: string) => formatDate(dateDebt),
    },
    {
      title: "Dernier Paiement",
      dataIndex: "lastDatePayee",
      key: "lastDatePayee",
      render: (lastDatePayee: string) => formatDate(lastDatePayee),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
    },
    {
      title: "Reste",
      dataIndex: "rest",
      key: "rest",
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <span
          className={`px-2 py-1 rounded text-white ${
            status === "payee" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {status === "payee" ? "Payée" : "Non Payée"}
        </span>
      ),
    },
    {
      title: "Avance",
      dataIndex: "avance",
      key: "avance",
    },
    {
      title: "Produits",
      dataIndex: "productIds",
      key: "productIds",
      render: (productIds: string[]) => {
        const productNames = productIds.map((productId: string) => {
          const product = productList.find(
            (product) => product.productID === productId
          );
          return product ? product.name : "Inconnu";
        });
        return <span>{productNames.join("-/ ")}</span>;
      },
    },
  ];

  return (
    <div className="p-4">
      <div className=" flex justify-between p-2 items-center ">
        <div className=" p-2 bg-white rounded ">
          <span className="text-black font-poppins font-bold">
            Gestion des Dettes
          </span>
        </div>

        <button
          className="px-4 py-2 flex items-center min-w-[120px] text-center text-white bg-emerald-400 border-emerald-600 shadow-xl hover:shadow rounded active:text-white-500 focus:ring"
          onClick={() => showModal()}
        >
          <FaPlus className="mr-2" />
          ajouter un dette
        </button>
      </div>
      <Select
        showSearch
        placeholder="Filtrer par client"
        allowClear
        style={{
          width: 300,
          height: 50,
          fontSize: "16px",
        }}
        onChange={handleClientFilter}
        options={clientList.map((client: Client) => ({
          label: `${client.firstname} ${client.lastName}`, // Ensure correct order here
          value: client.clientID,
        }))}
        filterOption={(input, option) =>
          (option?.label as string).toLowerCase().includes(input.toLowerCase())
        }
      />

      <div className="grid grid-cols-3 gap-4 mt-4">
        <Card
          className="shadow-lg p-4"
          title="Dettes Payées"
          style={{ borderLeft: "4px solid green" }}
        >
          <p className="text-2xl font-bold">{totalPaidDebts}</p>
        </Card>
        <Card
          className="shadow-lg p-4"
          title="Dettes Non Payées"
          style={{ borderLeft: "4px solid red" }}
        >
          <p className="text-2xl font-bold">{totalUnpaidDebts}</p>
        </Card>
        <Card
          className="shadow-lg p-4"
          title="Total Restant"
          style={{ borderLeft: "4px solid orange" }}
        >
          <p className="text-2xl font-bold">{totalRemaining} MAD</p>
        </Card>
      </div>

      <div className="mt-4">
        <Table
          columns={columns}
          dataSource={filteredDebtList}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize: itemsPerPage,
            onChange: (page) => setCurrentPage(page),
          }}
        />
      </div>
      <Modal
        title={isEdit ? "Modifier la Dette" : "Ajouter une Dette"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <form
          onSubmit={handleSubmit(isEdit ? handleUpdateDebt : handleCreateDebt)}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Client</label>
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
              {errors.clientID && <p>{errors.clientID.message}</p>}
            </div>

            <div>
              <label>Date de la Dette</label>
              <Controller
                name="dateDebt"
                control={control}
                rules={{ required: "La date de la dette est requise" }}
                render={({ field }) => (
                  <AntInput type="date" {...field} value={field.value} />
                )}
              />
              {errors.dateDebt && <p>{errors.dateDebt.message}</p>}
            </div>

            <div>
              <label>Date du Dernier Paiement</label>
              <Controller
                name="lastDatePayee"
                control={control}
                render={({ field }) => (
                  <AntInput type="date" {...field} value={field.value} />
                )}
              />
              {errors.lastDatePayee && <p>{errors.lastDatePayee.message}</p>}
            </div>

            <div>
              <label>Total</label>
              <Controller
                name="total"
                control={control}
                rules={{ required: "Le total est requis" }}
                render={({ field }) => <AntInput type="number" {...field} />}
              />
              {errors.total && <p>{errors.total.message}</p>}
            </div>

            <div>
              <label>Statut</label>
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
                <p style={{ color: "red" }}>{errors.status.message}</p>
              )}
            </div>

            <div>
              <label>Avance</label>
              <Controller
                name="avance"
                control={control}
                rules={{ required: "L'avance est requise" }}
                render={({ field }) => <AntInput type="number" {...field} />}
              />
              {errors.avance && <p>{errors.avance.message}</p>}
            </div>

            <div className="col-span-2">
              <label>Produits</label>
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

          <div className="mt-4 flex justify-end ">
            <Button
              type="primary"
              htmlType="submit"
              className="bg-emerald-500 hover:bg-emerald-300"
            >
              {isEdit ? "Mettre à Jour la Dette" : "Créer la Dette"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DebtPage;
