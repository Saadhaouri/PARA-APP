import { Alert, Spin } from "antd";
import React, { ChangeEvent, FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaLeaf,
  FaShieldAlt,
} from "react-icons/fa";
import logopara from "../assets/logopara.png";
import authStore from "../auth/authStore";
import axiosApi from "../Config/axiosAPI";

interface LoginForm {
  usernameOrEmail: string;
  password: string;
  rememberMe: boolean;
}

const LoginPage: React.FC = () => {
  const LogUser = authStore((state) => state.logIn);
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState<LoginForm>({
    usernameOrEmail: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setLoginForm((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await axiosApi.post("/Account/login", loginForm);

      localStorage.setItem("token", response.data.token);

      if (loginForm.rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      LogUser();
      navigate("/");
    } catch (error) {
      console.error("Échec de la connexion :", error);
      setErrorMessage("Nom d'utilisateur ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-100">
      {/* Decorative background */}
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-teal-200/30 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-lime-200/20 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/60 bg-white/80 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
          {/* Left branding panel */}
          <div className="hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <img src={logopara} alt="Logo" className="h-9 w-9 object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold">Para Semlali</h1>
                  <p className="text-sm text-white/80">
                    Gestion moderne de votre parapharmacie
                  </p>
                </div>
              </div>

              <div className="mt-12">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
                  Plateforme professionnelle
                </p>
                <h2 className="mt-4 text-4xl font-extrabold leading-tight">
                  Connectez-vous à votre espace de gestion
                </h2>
                <p className="mt-4 max-w-md text-base leading-7 text-white/85">
                  Suivez vos ventes, votre stock, vos promotions et vos performances
                  mensuelles dans une interface claire, fluide et pensée pour la
                  parapharmacie.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4">
                <FaLeaf className="text-xl" />
                <div>
                  <p className="font-semibold">Univers parapharmacie</p>
                  <p className="text-sm text-white/80">
                    Design doux, professionnel et rassurant
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4">
                <FaShieldAlt className="text-xl" />
                <div>
                  <p className="font-semibold">Accès sécurisé</p>
                  <p className="text-sm text-white/80">
                    Connexion protégée pour vos données de gestion
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right form panel */}
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 text-center lg:text-left">
                <div className="mb-4 flex justify-center lg:hidden">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 shadow-sm">
                    <img src={logopara} alt="Logo" className="h-10 w-10 object-contain" />
                  </div>
                </div>

                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-500">
                  Bon retour
                </p>
                <h2 className="mt-2 text-3xl font-extrabold text-gray-800">
                  Connexion
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Accédez à votre tableau de bord et gérez votre parapharmacie
                  en toute simplicité.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {errorMessage && (
                  <Alert
                    message={errorMessage}
                    type="error"
                    showIcon
                    className="rounded-2xl"
                  />
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Adresse email
                  </label>
                  <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-4 shadow-sm transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                    <FaEnvelope className="mr-3 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      name="usernameOrEmail"
                      placeholder="votre@email.com"
                      value={loginForm.usernameOrEmail}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border-none bg-transparent py-3.5 text-gray-700 outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      Mot de passe
                    </label>

                    <Link
                      to="/forgot-password"
                      className="text-xs font-medium text-emerald-600 transition hover:text-emerald-700"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-4 shadow-sm transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                    <FaLock className="mr-3 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder="Entrez votre mot de passe"
                      value={loginForm.password}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border-none bg-transparent py-3.5 text-gray-700 outline-none placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="ml-3 text-gray-500 transition hover:text-emerald-600"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
                  <label
                    htmlFor="remember"
                    className="flex cursor-pointer items-center gap-3"
                  >
                    <input
                      type="checkbox"
                      id="remember"
                      name="rememberMe"
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      checked={loginForm.rememberMe}
                      onChange={handleChange}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Se souvenir de moi
                    </span>
                  </label>

                  <span className="text-xs text-gray-500">Session sécurisée</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:from-emerald-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {loading ? (
                    <>
                      <Spin size="small" />
                      Connexion en cours...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </button>
              </form>

              <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-center text-sm leading-6 text-gray-600">
                  Plateforme dédiée à la gestion des ventes, du stock, des
                  fournisseurs, des promotions et des calculs mensuels de votre
                  parapharmacie.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;