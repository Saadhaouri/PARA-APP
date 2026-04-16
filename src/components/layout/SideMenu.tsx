import { Modal } from "antd";
import React, { useMemo, useState } from "react";
import { BsTruck } from "react-icons/bs";
import { CiBoxes, CiLogout, CiShoppingBasket } from "react-icons/ci";
import { GoPaste, GoPerson } from "react-icons/go";
import { ImTree } from "react-icons/im";
import { LuLayoutDashboard } from "react-icons/lu";
import { PiAddressBookLight } from "react-icons/pi";
import { GiMoneyStack } from "react-icons/gi";
import { NavLink, useNavigate } from "react-router-dom";
import authStore from "../../auth/authStore";
import useUser from "../../hooks/useUser";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  link: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const adminMenuSections: MenuSection[] = [
  {
    title: "Opérations",
    items: [
      {
        icon: LuLayoutDashboard,
        label: "Tableau de bord",
        link: "/",
      },
      {
        icon: CiShoppingBasket,
        label: "Ventes",
        link: "/stock",
      },
      {
        icon: CiBoxes,
        label: "Stock",
        link: "/products",
      },
      {
        icon: GoPaste,
        label: "Commandes",
        link: "/orders",
      },
    ],
  },
  {
    title: "Inventaire",
    items: [
      {
        icon: ImTree,
        label: "Catégories",
        link: "/categories",
      },
      {
        icon: BsTruck,
        label: "Fournisseurs",
        link: "/supplier",
      },
    ],
  },
  {
    title: "Clients",
    items: [
      {
        icon: PiAddressBookLight,
        label: "Clients",
        link: "/clients",
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        icon: GiMoneyStack,
        label: "Dettes",
        link: "/dettes",
      },
      {
        icon: GiMoneyStack,
        label: "Calculs mensuels",
        link: "/monthly-benefits",
      },
    ],
  },
];

const userMenuSections: MenuSection[] = [
  {
    title: "Opérations",
    items: [
      {
        icon: CiShoppingBasket,
        label: "Ventes",
        link: "/stock",
      },
    ],
  },
];

const accountMenuItems: MenuItem[] = [
  {
    icon: GoPerson,
    label: "Profil",
    link: "/profile",
  },
];

const MenuLink = ({
  icon: Icon,
  label,
  link,
}: MenuItem): JSX.Element => {
  return (
    <li>
      <NavLink
        to={link}
        className={({ isActive }) =>
          `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
            isActive
              ? "bg-emerald-500 text-white shadow-md"
              : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-600"
          }`
        }
      >
        <span className="text-xl">
          <Icon />
        </span>
        <span className="truncate">{label}</span>
      </NavLink>
    </li>
  );
};

const SideMenu: React.FC = () => {
  const navigate = useNavigate();
  const logOut = authStore((state) => state.logOut);
  // const user = authStore((state) => state.user);
    const { userAuth} = useUser();

  const [isModalVisible, setIsModalVisible] = useState(false);

  const showLogoutModal = () => setIsModalVisible(true);

  const handleOk = () => {
    setIsModalVisible(false);
    logOut();
    navigate("/login", { replace: true });
  };

  const handleCancel = () => setIsModalVisible(false);

  // const role = String(user?.userole || "").toLowerCase();
  const role = String(userAuth?.userole || "").toLowerCase();
  const menuSections = useMemo(() => {
    if (role === "admin") return adminMenuSections;
    if (role === "user") return userMenuSections;
    return [];
  }, [role]);

  return (
    <aside className="h-screen w-72 border-r border-emerald-100 bg-white shadow-sm">
      <div className="flex h-full flex-col">
        <div className="border-b border-emerald-100 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-xl font-bold text-white shadow-md">
              P
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">
                Para Manager
              </h1>
              <p className="text-sm text-gray-500">
                {role === "admin" ? "Espace administrateur" : "Espace utilisateur"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 px-4 py-5">
          {menuSections.map((section) => (
            <div key={section.title}>
              <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                {section.title}
              </p>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <MenuLink
                    key={item.link}
                    icon={item.icon}
                    label={item.label}
                    link={item.link}
                  />
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Compte
            </p>
            <ul className="space-y-2">
              {accountMenuItems.map((item) => (
                <MenuLink
                  key={item.link}
                  icon={item.icon}
                  label={item.label}
                  link={item.link}
                />
              ))}

              <li>
                <button
                  onClick={showLogoutModal}
                  className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-50"
                >
                  <span className="text-xl">
                    <CiLogout />
                  </span>
                  <span className="truncate">Se déconnecter</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <Modal
          title="Confirmer la déconnexion"
          open={isModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
          okText="Oui, Déconnexion"
          cancelText="Annuler"
          okButtonProps={{ danger: true }}
        >
          <p>Êtes-vous sûr de vouloir vous déconnecter ?</p>
        </Modal>
      </div>
    </aside>
  );
};

export default SideMenu; 