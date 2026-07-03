import { api } from "./api";
import type {
  AdminUserDetail,
  AdminUserListResponse,
  CreateAdminUserPayload,
  ListAdminUsersParams,
} from "../types/adminUser";

export const adminUserService = {
  listUsers(params: ListAdminUsersParams = {}) {
    const { search = "", page = 1, pageSize = 20 } = params;
    return api.get<AdminUserListResponse>("/users", {
      params: { search, page, pageSize },
    });
  },

  getUserById(userId: number) {
    return api.get<AdminUserDetail>(`/users/${userId}`);
  },

  createUser(payload: CreateAdminUserPayload) {
    return api.post<AdminUserDetail>("/users", payload);
  },

  deleteUser(userId: number) {
    return api.delete<AdminUserDetail>(`/users/${userId}`);
  },
};