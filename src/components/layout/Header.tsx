import React from "react";
import { Link } from "react-router-dom";
import useUser from "../../hooks/useUser";
import { GiCottonFlower } from "react-icons/gi";

const Header: React.FC = () => {
  const { userAuth, loading, error } = useUser();

  // Function to generate avatar letters
  const generateAvatarLetters = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  return (
    <div className="w-full top-0 flex flex-row items-center justify-between bg-white p-2 border-b border-gray-300">
      {/* Logo */}
      <div className="flex justify-center items-center">
        <GiCottonFlower className="text-[36px] text-emerald-500 mr-2" />
        <strong className="text-emerald-500 text-lg font-semibold">
          YOUSMALA
        </strong>
      </div>

      {/* User Info */}
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : (
        <Link
          to="/profile"
          className="hover:bg-gray-100 hover:cursor-pointer p-2 rounded-full"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 flex items-center justify-center bg-emerald-500 text-white font-bold rounded-full mr-2">
              {userAuth
                ? generateAvatarLetters(userAuth.firstName, userAuth.lastName)
                : ""}
            </div>
            <span className="text-gray-700 text-lg">
              {userAuth ? `${userAuth.firstName} ${userAuth.lastName}` : ""}
            </span>
          </div>
        </Link>
      )}
    </div>
  );
};

export default Header;
