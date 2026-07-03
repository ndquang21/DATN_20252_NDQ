export type RegisterDTO = {
  email: string;
  password: string;
  username: string;
};

export type LoginDTO = {
  email: string;
  password: string;
};

export type ForgotPasswordDTO = {
  email: string;
};

export type ResetPasswordDTO = {
  token: string;
  newPassword: string;
  confirmPassword: string;
};