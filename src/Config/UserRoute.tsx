import { Navigate } from "react-router-dom";
import authStore from "../auth/authStore";
import useUser from "../hooks/useUser";

const UserRoute = ({ element }: { element: JSX.Element }) => {
  // const user = authStore((state) => state.user);

    const { userAuth } = useUser();

  const isAuth = authStore((state) => state.isAuth);

  if (!isAuth) return <Navigate to="/login" replace />;
  if (!userAuth) return <div>Loading...</div>;
  if (userAuth.userole !== "user") return <Navigate to="/dashboard" replace />;

  return element;
};

export default UserRoute;