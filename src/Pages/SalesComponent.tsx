import React from "react";
import AdminSalesComponent from "./AdminSalesComponent";
import UserSalesComponent from "./UserSalesComponent";
import useUser from "../hooks/useUser";

const SalesComponent: React.FC = () => {
  const { userAuth } = useUser();

  if (userAuth?.userole === "admin") {
    return <AdminSalesComponent />;
  }

  if (userAuth?.userole === "user") {
    return <UserSalesComponent />;
  }

  return (
    <div>
      hello
      {userAuth?.username ? `: ${userAuth.username}` : ""}
    </div>
  );
};

export default SalesComponent;