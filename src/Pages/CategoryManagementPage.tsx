import { DeleteOutlined, EditOutlined, PlusOutlined, TagsOutlined } from "@ant-design/icons";
import { Button, Empty, Modal, Pagination, Spin, message } from "antd";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useGetProductsByCategoryId } from "../hooks/useCategories";

interface Category {
  id: string;
  name: string;
}

const CategoryComponent: React.FC = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [listCategories, setListCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [categoriesPage, setCategoriesPage] = useState(1);
  const [productsPage, setProductsPage] = useState(1);
  const [categoriesPageSize, setCategoriesPageSize] = useState(6);
  const [productsPageSize, setProductsPageSize] = useState(8);

  const { register, handleSubmit, reset, setValue } = useForm<Category>();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await axios.get("http://localhost:5133/Category");
        setListCategories(response.data ?? []);
      } catch (error) {
        console.error(
          "Une erreur s'est produite lors de la récupération des catégories !",
          error
        );
        message.error("Impossible de charger les catégories.");
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const { products, loading: productsLoading } =
    useGetProductsByCategoryId(selectedCategoryId);

  const showCreateModal = () => {
    reset({ name: "" });
    setIsCreateModalVisible(true);
  };

  const showUpdateModal = (category: Category) => {
    setCurrentCategory(category);
    setValue("name", category.name);
    setIsUpdateModalVisible(true);
  };

  const handleCancel = () => {
    setIsCreateModalVisible(false);
    setIsUpdateModalVisible(false);
    setCurrentCategory(null);
    reset();
  };

  const handleSelectCategory = (categoryId: string, categoryName: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(categoryName);
    setProductsPage(1);
  };

  const handleDeleteCategory = (categoryId: string) => {
    Modal.confirm({
      title: "Supprimer cette catégorie ?",
      content: "Cette action est irréversible.",
      okText: "Supprimer",
      cancelText: "Annuler",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await axios.delete(`http://localhost:5133/Category/${categoryId}`);
          setListCategories((prev) => prev.filter((c) => c.id !== categoryId));

          if (selectedCategoryId === categoryId) {
            setSelectedCategoryId("");
            setSelectedCategoryName("");
          }

          message.success("Catégorie supprimée avec succès !");
        } catch (error) {
          message.error(
            "Une erreur s'est produite lors de la suppression de la catégorie !"
          );
          console.error(
            "Une erreur s'est produite lors de la suppression de la catégorie !",
            error
          );
        }
      },
    });
  };

  const onCreateSubmit = async (data: Category) => {
    try {
      const response = await axios.post("http://localhost:5133/Category", data);
      setListCategories((prev) => [...prev, response.data]);
      message.success("Catégorie créée avec succès !");
      handleCancel();
    } catch (error) {
      message.error(
        "Une erreur s'est produite lors de la création de la catégorie !"
      );
      console.error(
        "Une erreur s'est produite lors de la création de la catégorie !",
        error
      );
    }
  };

  const onUpdateSubmit = async (data: Category) => {
    if (!currentCategory) return;

    try {
      const response = await axios.put(
        `http://localhost:5133/Category/${currentCategory.id}`,
        data
      );

      setListCategories((prev) =>
        prev.map((c) => (c.id === currentCategory.id ? response.data : c))
      );

      if (selectedCategoryId === currentCategory.id) {
        setSelectedCategoryName(response.data.name);
      }

      message.success("Catégorie mise à jour avec succès !");
      handleCancel();
    } catch (error) {
      message.error(
        "Une erreur s'est produite lors de la mise à jour de la catégorie !"
      );
      console.error(
        "Une erreur s'est produite lors de la mise à jour de la catégorie !",
        error
      );
    }
  };

  const handleCategoriesPageChange = (page: number, pageSize: number) => {
    setCategoriesPage(page);
    setCategoriesPageSize(pageSize);
  };

  const handleProductsPageChange = (page: number, pageSize: number) => {
    setProductsPage(page);
    setProductsPageSize(pageSize);
  };

  const paginatedCategories = useMemo(() => {
    return listCategories.slice(
      (categoriesPage - 1) * categoriesPageSize,
      categoriesPage * categoriesPageSize
    );
  }, [listCategories, categoriesPage, categoriesPageSize]);

  const paginatedProducts = useMemo(() => {
    return products.slice(
      (productsPage - 1) * productsPageSize,
      productsPage * productsPageSize
    );
  }, [products, productsPage, productsPageSize]);

  return (
    <div className="mx-auto w-full p-4 md:p-6">
      <div className="mb-6 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Gestion</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-800">
              Catégories
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Gérez vos catégories et consultez les produits associés.
            </p>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={showCreateModal}
            className="!h-11 !rounded-xl !bg-emerald-500 !px-5 !font-semibold hover:!bg-emerald-600"
          >
            Nouvelle catégorie
          </Button>
        </div>
      </div>

      <div className="mb-8 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Liste des catégories
            </h2>
            <p className="text-sm text-gray-500">
              {listCategories.length} catégorie(s) disponible(s)
            </p>
          </div>
        </div>

        {categoriesLoading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <Spin size="large" />
          </div>
        ) : listCategories.length === 0 ? (
          <Empty description="Aucune catégorie trouvée" />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedCategories.map((category) => {
                const isSelected = selectedCategoryId === category.id;

                return (
                  <div
                    key={category.id}
                    onClick={() => handleSelectCategory(category.id, category.name)}
                    className={`group cursor-pointer rounded-2xl border p-5 transition-all duration-300 ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-50 shadow-md"
                        : "border-gray-100 bg-white hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-2xl p-3 ${
                            isSelected ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          <TagsOutlined className="text-lg" />
                        </div>

                        <div>
                          <h3 className="text-base font-semibold text-gray-800">
                            {category.name}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Cliquer pour voir les produits
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <EditOutlined
                          className="text-lg text-blue-500 transition hover:text-blue-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            showUpdateModal(category);
                          }}
                        />
                        <DeleteOutlined
                          className="text-lg text-red-500 transition hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category.id);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-center">
              <Pagination
                current={categoriesPage}
                pageSize={categoriesPageSize}
                total={listCategories.length}
                onChange={handleCategoriesPageChange}
                showSizeChanger
              />
            </div>
          </>
        )}
      </div>

      {selectedCategoryId && (
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Produits de la catégorie
              </h2>
              <p className="text-sm text-gray-500">
                Catégorie sélectionnée :
                <span className="ml-1 font-semibold text-emerald-600">
                  {selectedCategoryName}
                </span>
              </p>
            </div>

            <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600">
              {products.length} produit(s)
            </div>
          </div>

          {productsLoading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <Spin size="large" />
            </div>
          ) : products.length === 0 ? (
            <Empty description="Aucun produit dans cette catégorie" />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {paginatedProducts.map((product) => (
                  <div
                    key={product.productID}
                    className="flex min-h-[220px] flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div>
                      <h3 className="line-clamp-1 text-lg font-bold text-gray-800">
                        {product.name}
                      </h3>
                      <p className="mt-3 line-clamp-3 text-sm text-gray-500">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-5 border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Prix</span>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-600">
                          {product.price} DH
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                <Pagination
                  current={productsPage}
                  pageSize={productsPageSize}
                  total={products.length}
                  onChange={handleProductsPageChange}
                  showSizeChanger
                />
              </div>
            </>
          )}
        </div>
      )}

      <Modal
        title="Nouvelle catégorie"
        open={isCreateModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <form onSubmit={handleSubmit(onCreateSubmit)} className="mt-4">
          <div className="mb-4">
            <label
              htmlFor="createCategoryName"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Nom de la catégorie
            </label>
            <input
              type="text"
              {...register("name", { required: true })}
              id="createCategoryName"
              className="block w-full rounded-xl border border-gray-300 p-3 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="Entrer le nom de la catégorie"
              required
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="primary"
              htmlType="submit"
              className="!rounded-xl !bg-emerald-500 !px-5 !font-semibold hover:!bg-emerald-600"
            >
              Créer
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        title="Mettre à jour une catégorie"
        open={isUpdateModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <form onSubmit={handleSubmit(onUpdateSubmit)} className="mt-4">
          <div className="mb-4">
            <label
              htmlFor="updateCategoryName"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Nom de la catégorie
            </label>
            <input
              type="text"
              {...register("name", { required: true })}
              id="updateCategoryName"
              className="block w-full rounded-xl border border-gray-300 p-3 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="Modifier le nom de la catégorie"
              required
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="primary"
              htmlType="submit"
              className="!rounded-xl !bg-emerald-500 !px-5 !font-semibold hover:!bg-emerald-600"
            >
              Mettre à jour
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CategoryComponent;