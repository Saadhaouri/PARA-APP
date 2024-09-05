import { useState, useEffect } from "react";
import { Modal, message, Select } from "antd";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import axios from "axios";
import { createOrder } from "../Services/orderService";
import { FaPlus } from "react-icons/fa";

type Supplier = {
  supplierId: string;
  name: string;
};

type Client = {
  clientID: string;
  firstname: string;
  lastName: string;
};

type Product = {
  productID: string;
  name: string;
};

interface Order {
  supplierId: string;
  totalAmount: number;
  status: string;
  clientId: string;
  productIds: string[];
}

const OrderTest = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [supplierList, setSupplierList] = useState<Supplier[]>([]);
  const [clientList, setClientList] = useState<Client[]>([]);
  const [productList, setProductList] = useState<Product[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Order>({ defaultValues: {} });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliers, clients, products] = await Promise.all([
          axios.get("http://localhost:88/Supplier"),
          axios.get("http://localhost:88/Client"),
          axios.get("http://localhost:88/Product"),
        ]);
        setSupplierList(suppliers.data);
        setClientList(clients.data);
        setProductList(products.data);
      } catch (error) {
        console.error("There was an error fetching data!", error);
      }
    };

    fetchData();
  }, []);

  const handleCreateOrder: SubmitHandler<Order> = async (data) => {
    try {
      // Call your create order service
      await createOrder(data);
      setIsModalVisible(false);
      message.success("Commande ajoutée avec succès");
      reset(); // Reset the form fields after successful creation
    } catch (error) {
      message.error("Erreur lors de l'ajout de la commande");
      console.error("Failed to create order:", error);
    }
  };

  const showModal = () => {
    setIsEdit(false);
    reset({});
    setIsModalVisible(true);
  };

  const handleOk = () => {
    handleSubmit(handleCreateOrder)();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <div className="overflow-y-auto bg-gray-200">
      <div className="flex items-center justify-between p-3">
        <button
          onClick={showModal}
          className="px-6 py-2 flex items-center min-w-[120px] text-center text-white bg-emerald-400 border-emerald-600 shadow-xl hover:shadow rounded active:text-white-500 focus:ring"
        >
          <FaPlus className="mr-2" />
          Ajouter commande
        </button>
      </div>

      <Modal
        title={isEdit ? "Modifier la commande" : "Ajouter une commande"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={isEdit ? "Modifier" : "Ajouter"}
        cancelText="Annuler"
      >
        <form onSubmit={handleSubmit(handleCreateOrder)} className="space-y-6">
          <Controller
            name="supplierId"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col space-y-2">
                <select
                  {...field}
                  className="border border-gray-300 p-2 rounded-md focus:border-blue-500"
                >
                  <option value="">Sélectionner un fournisseur</option>
                  {supplierList.map((supplier) => (
                    <option
                      key={supplier.supplierId}
                      value={supplier.supplierId}
                    >
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {errors.supplierId && (
                  <p className="text-red-500 text-sm">
                    {errors.supplierId.message}
                  </p>
                )}
              </div>
            )}
          />
          <Controller
            name="totalAmount"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col space-y-2">
                <input
                  {...field}
                  placeholder="Montant Total"
                  type="number"
                  className="border border-gray-300 p-2 rounded-md focus:border-blue-500"
                />
                {errors.totalAmount && (
                  <p className="text-red-500 text-sm">
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
              <div className="flex flex-col space-y-2">
                <Select {...field} placeholder="Statut">
                  <Select.Option value="En attente">En attente</Select.Option>
                  <Select.Option value="En cours">En cours</Select.Option>
                  <Select.Option value="Prêt à expédier">
                    Prêt à expédier
                  </Select.Option>
                  <Select.Option value="Expédié">Expédié</Select.Option>
                  <Select.Option value="Livré">Livré</Select.Option>
                  <Select.Option value="Annulé">Annulé</Select.Option>
                  <Select.Option value="Retour demandé">
                    Retour demandé
                  </Select.Option>
                  <Select.Option value="Retour accepté">
                    Retour accepté
                  </Select.Option>
                  <Select.Option value="Retour rejeté">
                    Retour rejeté
                  </Select.Option>
                  <Select.Option value="Échoué">Échoué</Select.Option>
                </Select>
                {errors.status && (
                  <p className="text-red-500 text-sm">
                    {errors.status.message}
                  </p>
                )}
              </div>
            )}
          />
          <Controller
            name="clientId"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col space-y-2">
                <select
                  {...field}
                  className="border border-gray-300 p-2 rounded-md focus:border-blue-500"
                >
                  <option value="">Sélectionner un client</option>
                  {clientList.map((client) => (
                    <option key={client.clientID} value={client.clientID}>
                      {client.firstname} {client.lastName}
                    </option>
                  ))}
                </select>
                {errors.clientId && (
                  <p className="text-red-500 text-sm">
                    {errors.clientId.message}
                  </p>
                )}
              </div>
            )}
          />
          <Controller
            name="productIds"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col space-y-2">
                <Select
                  {...field}
                  showSearch
                  mode="multiple"
                  placeholder="Sélectionner des produits"
                  className="w-full border p-2 rounded-md focus:border-blue-500"
                  onChange={(value) => field.onChange(value)}
                  value={field.value || []}
                  optionFilterProp="label"
                >
                  {productList.map((product) => (
                    <Select.Option
                      key={product.productID}
                      value={product.productID}
                      label={product.name}
                    >
                      {product.name}
                    </Select.Option>
                  ))}
                </Select>
                {errors.productIds && (
                  <p className="text-red-500 text-sm">
                    {errors.productIds.message}
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

export default OrderTest;
