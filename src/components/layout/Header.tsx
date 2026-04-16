import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useUser from "../../hooks/useUser";
import logopara from "../../assets/logopara.png";
import { FaRegClock, FaRegCalendarAlt, FaUserCircle } from "react-icons/fa";

const Header: React.FC = () => {
  const { userAuth, loading, error } = useUser();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const generateAvatarLetters = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [currentTime]);

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [currentTime]);
  

  return (
    <header className="sticky top-0 z-30 w-full border-b border-emerald-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 shadow-sm">
            <img src={logopara} alt="Para Semlali" className="h-9 w-9 object-contain" />
          </div>

          <div>
            <h1 className="text-lg font-bold text-gray-800 md:text-xl">
              Para Semlali
            </h1>
            <p className="text-sm text-gray-500">
              Tableau de bord de gestion
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2 text-emerald-600">
              <FaRegCalendarAlt />
              <span className="text-sm font-medium capitalize text-gray-700">
                {formattedDate}
              </span>
            </div>

            <div className="hidden h-6 w-px bg-gray-200 md:block" />

            <div className="flex items-center gap-2 text-emerald-600">
              <FaRegClock />
              <span className="text-sm font-semibold text-gray-800">
                {formattedTime}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
              <div>
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="mt-2 h-3 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              Error: {error}
            </div>
          ) : (
            <Link
              to="/profile"
              className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 font-bold text-white shadow-sm">
                {userAuth
                  ? generateAvatarLetters(userAuth.firstName, userAuth.lastName)
                  : <FaUserCircle />}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-800">
                  {userAuth ? `${userAuth.firstName} ${userAuth.lastName}` : "Utilisateur"}
                </p>
                <p className="text-xs text-gray-500">Voir le profil</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;