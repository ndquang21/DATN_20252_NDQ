export type UserRole = "user" | "admin";

export type Gender = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type Goal = "lose_weight" | "maintain" | "gain_weight";export type AdminUserListItem = {
  user_id: number;
  email: string;
  username: string;
  role: UserRole;
  gender: Gender | null;
  dob: string | null;
  created_at: string;
  updated_at: string;
};export type AdminUserDetail = AdminUserListItem & {
  avatar_url: string | null;
};export type CreateAdminUserPayload = {
  email: string;
  password: string;
  username: string;
  role: UserRole;
};export type AdminUserListResponse = {
    items: AdminUserListItem[];
    total: number;
    page: number;
    pageSize: number;
  };
  
  export type ListAdminUsersParams = {
    search?: string;
    page?: number;
    pageSize?: number;
  };