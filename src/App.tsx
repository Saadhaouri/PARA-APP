import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import authStore from "./auth/authStore";
import ProtectedRoute from "./auth/ProtectedRoute";
import Header from "./components/layout/Header";
import SideMenu from "./components/layout/SideMenu";
import CapitalBenefits from "./Pages/CapitalBenefits";
import CategoryManagementPage from "./Pages/CategoryManagementPage";
import ClientManagementPage from "./Pages/ClientManagementPage";
import DashboardPage from "./Pages/Dashboard/DashboardPage";
import DebtManagementPage from "./Pages/DebtManagementPage";
import ForgotPasswordPage from "./Pages/ForgotPasswordPage";
import LoginPage from "./Pages/LoginPage";
import OrderManagementPage from "./Pages/OrderManagementPage";
import ProductManagementPage from "./Pages/Products/ProductManagementPage";
import PromotionManagementPage from "./Pages/PromotionManagementPage";
import SupplierManagementPage from "./Pages/SupplierManagementPage";
import UserManegement from "./Pages/UserManegement";
import SalesComponent from "./Pages/SalesComponent";
import useUser from "./hooks/useUser";
import { useNavigate } from "react-router-dom";
 
const queryClient = new QueryClient();

const HomeRedirect = () => {
   const { userAuth } = useUser();

  const isAuth = authStore((state) => state.isAuth);
  const navigate = useNavigate();

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (!userAuth) {
    return (
  <div className="flex min-h-[400px] items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-pink-50 p-6">
  <div className="w-full max-w-md rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl p-8 text-center relative overflow-hidden">
    
    {/* Glow background */}
    <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-emerald-300 opacity-30 blur-3xl"></div>
    <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-pink-300 opacity-30 blur-3xl"></div>

    {/* Icon */}
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-pink-500 text-white text-2xl shadow-lg">
      🛍️
    </div>

    {/* Title */}
    <h2 className="text-xl font-bold text-gray-800">
      Chargement du profil...
    </h2>

    {/* Subtitle */}
    <p className="mt-2 text-sm text-gray-500">
      Si cela prend trop de temps, vous pouvez continuer vers vos ventes.
    </p>

    {/* Button */}
    <button
      onClick={() => navigate("/stock")}
      className="mt-6 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
    >
      Aller aux ventes
    </button>

    {/* Small hint */}
    <p className="mt-4 text-xs text-gray-400">
      Accès rapide disponible
    </p>
  </div>
</div>
    );
  }

  const role = String(userAuth?.userole || "").toLowerCase();

  console.log("User role in HomeRedirect:", role);

  if (role === "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (role === "user") {
    return <Navigate to="/stock" replace />;
  }

  return <Navigate to="/login" replace />;
};
const AdminRoute = ({ element }: { element: JSX.Element }) => {
  const { userAuth  } = useUser();
  const isAuth = authStore((state) => state.isAuth);

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (!userAuth) {
    return <div className="p-6 text-center">Loading... hello 111 </div>;
  }


  const role = String(userAuth?.userole || "").toLowerCase();

  if (role !== "admin") {
    return <Navigate to="/stock" replace />;
  }

  return element;
};

function App() {
  const isAuth = authStore((state) => state.isAuth);

  useUser();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen flex-col">
        <Router>
          {isAuth && <Header />}

          <div className="flex flex-1 overflow-hidden">
            {isAuth && <SideMenu />}

            <main className="flex-1 overflow-y-auto bg-gray-100">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />

                <Route
                  path="/"
                  element={<ProtectedRoute element={<HomeRedirect />} />}
                />

                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute
                      element={<AdminRoute element={<DashboardPage />} />}
                    />
                  }
                />

                <Route
                  path="/profile"
                  element={<ProtectedRoute element={<UserManegement />} />}
                />

                <Route
                  path="/stock"
                  
                  element={<ProtectedRoute element={<SalesComponent />} />}
                />

                <Route
                  path="/orders"
                  element={<ProtectedRoute element={<OrderManagementPage />} />}
                />

                <Route
                  path="/order"
                  element={<ProtectedRoute element={<OrderManagementPage />} />}
                />

                <Route
                  path="/clients"
                  element={
                    <ProtectedRoute
                      element={<AdminRoute element={<ClientManagementPage />} />}
                    />
                  }
                />

                <Route
                  path="/supplier"
                  element={
                    <ProtectedRoute
                      element={<AdminRoute element={<SupplierManagementPage />} />}
                    />
                  }
                />

                <Route
                  path="/monthly-benefits"
                  element={
                    <ProtectedRoute
                      element={<AdminRoute element={<CapitalBenefits />} />}
                    />
                  }
                />

                <Route
                  path="/dettes"
                  element={
                    <ProtectedRoute
                      element={<AdminRoute element={<DebtManagementPage />} />}
                    />
                  }
                />

                <Route
                  path="/categories"
                  element={
                    <ProtectedRoute
                      element={<AdminRoute element={<CategoryManagementPage />} />}
                    />
                  }
                />

                <Route
                  path="/products"
                  element={
                    <ProtectedRoute
                      element={<AdminRoute element={<ProductManagementPage />} />}
                    />
                  }
                />

                <Route
                  path="/promotions"
                  element={
                    <ProtectedRoute
                      element={<AdminRoute element={<PromotionManagementPage />} />}
                    />
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>

        <ToastContainer />
        <ReactQueryDevtools />
      </div>
    </QueryClientProvider>
  );
}

export default App;