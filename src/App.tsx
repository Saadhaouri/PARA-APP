import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
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
import StockManagement from "./Pages/StockManegement";
import SupplierManagementPage from "./Pages/SupplierManagementPage";
import UserManegement from "./Pages/UserManegement";

const queryClient = new QueryClient();

function App() {
  const isAuth = authStore((state) => state.isAuth);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col h-screen">
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
                  element={<ProtectedRoute element={<DashboardPage />} />}
                />
                <Route
                  path="/profile"
                  element={<ProtectedRoute element={<UserManegement />} />}
                />
                <Route
                  path="/order"
                  element={<ProtectedRoute element={<OrderManagementPage />} />}
                />
                <Route
                  path="/clients"
                  element={
                    <ProtectedRoute element={<ClientManagementPage />} />
                  }
                />
                <Route
                  path="/supplier"
                  element={
                    <ProtectedRoute element={<SupplierManagementPage />} />
                  }
                />
                <Route
                  path="/monthly-benefits"
                  element={<ProtectedRoute element={<CapitalBenefits />} />}
                />
                <Route
                  path="/dettes"
                  element={<ProtectedRoute element={<DebtManagementPage />} />}
                />
                <Route
                  path="/categories"
                  element={
                    <ProtectedRoute element={<CategoryManagementPage />} />
                  }
                />
                <Route
                  path="/products"
                  element={
                    <ProtectedRoute element={<ProductManagementPage />} />
                  }
                />
                <Route
                  path="/stock"
                  element={<ProtectedRoute element={<StockManagement />} />}
                />
                <Route
                  path="/promotions"
                  element={
                    <ProtectedRoute element={<PromotionManagementPage />} />
                  }
                />
                <Route
                  path="/orders"
                  element={<ProtectedRoute element={<OrderManagementPage />} />}
                />
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
