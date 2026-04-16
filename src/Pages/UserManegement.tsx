import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Alert, Button, Modal, Spin, message } from "antd";
import {
  FaUserLock,
  FaRegClock,
  FaRegCalendarAlt,
  FaUserCircle,
  FaEnvelope,
  FaUser,
} from "react-icons/fa";
import { BsDatabaseUp } from "react-icons/bs";
import { HiSparkles } from "react-icons/hi2";
import { changePassword } from "../Services/userService";
import useUser from "../hooks/useUser";
import StockAlerts from "./Dashboard/StockAlerts";
import axiosApi from "../Config/axiosAPI";

interface FormData {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  message: string;
}

interface ChangePasswordData {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

const validationSchema = yup.object({
  currentPassword: yup.string().required("Veuillez saisir votre mot de passe actuel"),
  newPassword: yup
    .string()
    .required("Veuillez saisir un nouveau mot de passe")
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

const UserManagement: React.FC = () => {
  const { userAuth, loading, error } = useUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
  });

  const showModal = () => {
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    reset();
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const onSubmit = async (formData: FormData) => {
    try {
      setIsChangingPassword(true);

      const changePasswordData: ChangePasswordData = {
        userId: userAuth?.id || "",
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      };

      const response: ChangePasswordResponse = await changePassword(
        changePasswordData
      );

      message.success(response.message || "Mot de passe modifié avec succès");
      reset();
      setModalVisible(false);
    } catch (error) {
      console.error("Error changing password:", error);
      message.error("Erreur lors du changement de mot de passe");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const backupDatabase = async () => {
    setIsBackingUp(true);
    try {
      const response = await axiosApi.get("/Database/backup");
      message.success("Sauvegarde effectuée avec succès : " + response.data);
    } catch (error) {
      console.error("Error during database backup:", error);
      message.error("Erreur lors de la sauvegarde de la base de données.");
    } finally {
      setIsBackingUp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="rounded-3xl border border-emerald-100 bg-white px-8 py-10 shadow-xl">
          <div className="flex flex-col items-center gap-4">
            <Spin size="large" />
            <p className="text-sm font-medium text-gray-500">
              Chargement de votre espace utilisateur...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
        <Alert
          message="Erreur"
          description={error}
          type="error"
          showIcon
          className="max-w-xl rounded-2xl"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm">
          <div className="relative bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 px-6 py-8 text-white md:px-8">
            <div className="absolute right-6 top-6 hidden rounded-2xl bg-white/15 p-3 backdrop-blur md:block">
              <HiSparkles className="text-2xl" />
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
              Espace utilisateur
            </p>
            <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">
              Gestion du compte et sécurité 
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 md:text-base">
              Gérez votre profil, sécurisez votre accès et effectuez des actions
              administratives importantes pour votre application de parapharmacie.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Left column */}
          <div className="xl:col-span-4">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-10">
                  <div className="flex flex-col items-center text-center text-white">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/30 bg-white/15 text-3xl font-bold shadow-lg backdrop-blur">
                      {userAuth?.firstName?.charAt(0)}
                      {userAuth?.lastName?.charAt(0)}
                    </div>

                    <h2 className="mt-4 text-2xl font-extrabold">
                      {userAuth?.firstName} {userAuth?.lastName}
                    </h2>
                    <p className="mt-1 text-sm text-white/85">{userAuth?.email}</p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Informations</h3>
                      <p className="text-sm text-gray-500">
                        Détails liés à votre compte
                      </p>
                    </div>

                    <button
                      className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-100"
                      onClick={showModal}
                    >
                      <FaUserLock />
                      Mot de passe
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
                      <div className="mt-1 text-emerald-500">
                        <FaUser />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Nom d'utilisateur
                        </p>
                        <p className="mt-1 font-medium text-gray-800">
                          {userAuth?.userName || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
                      <div className="mt-1 text-emerald-500">
                        <FaEnvelope />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Email
                        </p>
                        <p className="mt-1 font-medium text-gray-800">
                          {userAuth?.email || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
                      <div className="mt-1 text-emerald-500">
                        <FaUserCircle />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Date de naissance
                        </p>
                        <p className="mt-1 font-medium text-gray-800">
                          {userAuth?.birthday || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm">
                <div className="border-b border-emerald-100 px-6 py-4">
                  <h3 className="text-lg font-bold text-gray-800">Alertes stock</h3>
                  <p className="text-sm text-gray-500">
                    Produits nécessitant votre attention
                  </p>
                </div>
                <div className="p-4">
                  <StockAlerts />
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="xl:col-span-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-500">
                      Sauvegarde
                    </p>
                    <h3 className="mt-2 text-2xl font-extrabold text-gray-800">
                      Exportation des données
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      Lancez une sauvegarde de votre base de données pour sécuriser
                      vos informations importantes.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 p-3 text-2xl text-emerald-600">
                    <BsDatabaseUp />
                  </div>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                  Cette action permet d’exporter les données de votre application
                  de gestion parapharmacie.
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    className="!flex !items-center !gap-2 !rounded-2xl !border-none !bg-emerald-500 !px-5 !py-6 !font-semibold !text-white hover:!bg-emerald-600"
                    onClick={backupDatabase}
                    loading={isBackingUp}
                  >
                    <BsDatabaseUp className="text-lg" />
                    Exporter les données
                  </Button>
                </div>
              </div>

              <div className="rounded-[28px] bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-500 p-6 text-white shadow-sm">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
                      Temps réel
                    </p>
                    <h3 className="mt-2 text-2xl font-extrabold">
                      Date & heure
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/85">
                      Suivi instantané de l’heure actuelle pour vos opérations
                      quotidiennes.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/15 p-3 text-2xl backdrop-blur">
                    <FaRegClock />
                  </div>
                </div>

                <div className="rounded-[24px] bg-white p-5 text-center shadow-lg">
                  <p className="text-3xl font-extrabold text-gray-800 md:text-4xl">
                    {currentDateTime.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>

                  <div className="mt-4 flex items-center justify-center gap-2 text-gray-500">
                    <FaRegCalendarAlt />
                    <p className="text-base font-medium">
                      {currentDateTime.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-500">
                  Sécurité
                </p>
                <h3 className="mt-2 text-2xl font-extrabold text-gray-800">
                  Sécurité du compte
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Modifiez votre mot de passe régulièrement pour renforcer la
                  sécurité de votre accès.
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">
                      Changement du mot de passe
                    </h4>
                    <p className="mt-1 text-sm text-gray-600">
                      Recommandé pour protéger vos données sensibles.
                    </p>
                  </div>

                  <button
                    onClick={showModal}
                    className="rounded-2xl bg-white px-5 py-3 font-semibold text-emerald-600 shadow-sm transition hover:bg-emerald-100"
                  >
                    Modifier le mot de passe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Modal
          title={
            <span className="text-lg font-bold text-gray-800">
              Changer le mot de passe
            </span>
          }
          open={modalVisible}
          onCancel={handleCancel}
          footer={null}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Mot de passe actuel
              </label>
              <input
                type="password"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                {...register("currentPassword")}
              />
              {errors.currentPassword && (
                <p className="mt-2 text-sm text-red-500">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                {...register("newPassword")}
              />
              {errors.newPassword && (
                <p className="mt-2 text-sm text-red-500">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="primary"
                htmlType="submit"
                loading={isChangingPassword}
                className="!h-12 !w-full !rounded-2xl !border-none !bg-emerald-500 !font-semibold hover:!bg-emerald-600"
              >
                Enregistrer le nouveau mot de passe
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default UserManagement;