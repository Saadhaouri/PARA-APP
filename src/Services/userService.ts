import axiosApi from "../Config/axiosAPI"; // Import the configured axios instance

const API_URL_ChangePassword = "/Account/changepassword"; // Use relative URL with axiosApi

interface ChangePassword {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export const changePassword = async (changePassword: ChangePassword) => {
  try {
    const response = await axiosApi.post(
      API_URL_ChangePassword,
      changePassword
    ); // Use axiosApi for the POST request
    return response.data;
  } catch (error) {
    // Handle error responses from the API
    throw error;
  }
};
