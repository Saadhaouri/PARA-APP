import { Navigate } from "react-router-dom";
import useUser from "../hooks/useUser";

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { userAuth   } = useUser();
  if (!userAuth) {
    return <Navigate to="/login" replace />;
  }

  if (userAuth.userole !== "admin") {
    return <Navigate to="/stock" replace />;
  }

  return children;
};

export default AdminRoute;