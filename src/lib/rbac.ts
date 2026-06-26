import { UserRole } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export function isSuperAdmin(user: SessionUser) {
  return user.role === "SUPER_ADMIN";
}

export function isTeslaEmployee(user: SessionUser) {
  return user.role === "TESLA_EMPLOYEE" || user.role === "SUPER_ADMIN";
}

export function isPartner(user: SessionUser) {
  return user.role === "PARTNER";
}

export function canManageListings(user: SessionUser) {
  return user.role === "TESLA_EMPLOYEE" || user.role === "SUPER_ADMIN";
}

export function canApproveReservations(user: SessionUser) {
  return user.role === "TESLA_EMPLOYEE" || user.role === "SUPER_ADMIN";
}

export function canManagePartners(user: SessionUser) {
  return user.role === "TESLA_EMPLOYEE" || user.role === "SUPER_ADMIN";
}

export function canManageUsers(user: SessionUser) {
  return user.role === "SUPER_ADMIN";
}

export function canReserveVehicles(user: SessionUser) {
  return user.role === "PARTNER";
}

export function getDashboardPath(role: UserRole) {
  switch (role) {
    case "SUPER_ADMIN":
      return "/admin";
    case "TESLA_EMPLOYEE":
      return "/tesla";
    case "PARTNER":
      return "/inventory";
    default:
      return "/";
  }
}
