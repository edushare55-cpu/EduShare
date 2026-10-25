"use client";

import { useState } from "react";
import { useToggleUserStatus, useDeleteUser } from "@/hooks/use-admin";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/types";
import { AddUserModal } from "@/components/admin/AddUserModal";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";

interface UsersClientProps {
  initialUsers: UserProfile[];
}

export default function UsersClient({ initialUsers }: UsersClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const { mutate: toggleStatus, isPending } = useToggleUserStatus();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  const filteredUsers = initialUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      roleFilter === "All Roles" ||
      user.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesDepartment =
      departmentFilter === "All Departments" ||
      (user.department && user.department.toLowerCase() === departmentFilter.toLowerCase());
    return matchesSearch && matchesRole && matchesDepartment;
  });

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    toggleStatus(
      { userId, isActive: !currentStatus },
      {
        onSuccess: () => {
          router.refresh();
        },
      }
    );
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) {
      deleteUser(userId, {
        onSuccess: () => {
          router.refresh();
        },
      });
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-md gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">
            User Management
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Manage students, faculty, and administrative staff access.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-secondary text-on-secondary px-[20px] py-[8px] rounded-DEFAULT font-label-md text-label-md hover:bg-secondary-container transition-colors flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add User
        </button>
      </div>

      <AddUserModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => {
          setIsModalOpen(false);
          router.refresh();
        }}
      />

      <EditUserModal 
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSuccess={() => {
          setEditingUser(null);
          router.refresh();
        }}
      />

      {/* Control Bar */}
      <div className="bg-surface-container-lowest rounded-xl p-md mb-md shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-end">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1">
          <div className="flex-1 max-w-md">
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
              Search Users
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                search
              </span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#CBD5E1] rounded-DEFAULT font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest transition-colors"
                placeholder="Search by name, ID, or email"
                type="text"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-[#CBD5E1] rounded-DEFAULT font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest transition-colors appearance-none pr-8 relative"
            >
              <option>All Roles</option>
              <option>Student</option>
              <option>Faculty</option>
              <option>Admin</option>
            </select>
          </div>
          <div className="w-full sm:w-48">
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
              Department
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-4 py-2 border border-[#CBD5E1] rounded-DEFAULT font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest transition-colors appearance-none pr-8 relative"
            >
              <option>All Departments</option>
              <option>Computer Science</option>
              <option>Engineering</option>
              <option>Business</option>
              <option>Administration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table / Mobile Cards */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low/50">
                <th className="py-3 px-6 font-label-md text-label-md text-on-surface-variant">
                  Name
                </th>
                <th className="py-3 px-6 font-label-md text-label-md text-on-surface-variant">
                  Role
                </th>
                <th className="py-3 px-6 font-label-md text-label-md text-on-surface-variant">
                  Department
                </th>
                <th className="py-3 px-6 font-label-md text-label-md text-on-surface-variant">
                  Status
                </th>
                <th className="py-3 px-6 font-label-md text-label-md text-on-surface-variant text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm divide-y divide-outline-variant/30">
              {filteredUsers.map((user) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  onToggleStatus={() => handleToggleStatus(user.id, user.isActive)}
                  onDelete={() => handleDeleteUser(user.id)}
                  onEdit={() => setEditingUser(user)}
                  isPending={isPending || isDeleting}
                />
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-on-surface-variant font-body-sm">
                    No users found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden divide-y divide-outline-variant/30">
          {filteredUsers.map((user) => (
            <MobileUserCard
              key={user.id}
              user={user}
              onToggleStatus={() => handleToggleStatus(user.id, user.isActive)}
              onDelete={() => handleDeleteUser(user.id)}
              onEdit={() => setEditingUser(user)}
              isPending={isPending || isDeleting}
            />
          ))}
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-on-surface-variant font-body-sm">
              No users found matching your filters.
            </div>
          )}
        </div>

        {/* Pagination (Visual only for now) */}
        <div className="p-4 border-t border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest">
          <div className="font-body-sm text-body-sm text-on-surface-variant">
            Showing 1 to {filteredUsers.length} of {initialUsers.length} users
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 text-outline hover:text-primary transition-colors disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded-DEFAULT bg-primary-container text-on-primary font-label-sm flex items-center justify-center">
              1
            </button>
            <button className="p-1 text-outline hover:text-primary transition-colors" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function UserTableRow({
  user,
  onToggleStatus,
  onDelete,
  onEdit,
  isPending,
}: {
  user: UserProfile;
  onToggleStatus: () => void;
  onDelete: () => void;
  onEdit: () => void;
  isPending: boolean;
}) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isStudent = user.role === "STUDENT";
  const isFaculty = user.role === "FACULTY";

  return (
    <tr className="hover:bg-surface-container-low/20 transition-colors group">
      <td className="py-3 px-6">
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div
              className={`w-8 h-8 rounded-full ${
                isStudent
                  ? "bg-primary-container text-on-primary"
                  : isFaculty
                  ? "bg-tertiary-container text-on-tertiary"
                  : "bg-secondary-container text-on-secondary-container"
              } flex items-center justify-center font-bold text-xs`}
            >
              {getInitials(user.name)}
            </div>
          )}
          <div>
            <div className="font-medium text-on-surface">{user.name}</div>
            <div className="text-xs text-on-surface-variant">
              {user.email}
            </div>
          </div>
        </div>
      </td>
      <td className="py-3 px-6 capitalize">{user.role.toLowerCase()}</td>
      <td className="py-3 px-6">{user.department || "—"}</td>
      <td className="py-3 px-6">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-DEFAULT ${
            user.isActive
              ? "bg-[#F0F9FF] text-[#0284C7]"
              : "bg-surface-variant text-on-surface-variant"
          } font-label-sm text-label-sm`}
        >
          {user.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="py-3 px-6 text-right">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
          {!isStudent && (
            <button
              onClick={onEdit}
              className="p-1.5 text-on-surface-variant hover:text-primary transition-colors rounded-DEFAULT hover:bg-surface-container-low"
              title="Edit Password"
            >
              <span className="material-symbols-outlined text-[18px]" data-icon="edit">
                edit
              </span>
            </button>
          )}
          <button
            onClick={onToggleStatus}
            disabled={isPending}
            className={`flex items-center gap-1 px-2 py-1.5 ${
              user.isActive
                ? "text-error hover:bg-error-container/20"
                : "text-on-surface-variant hover:bg-surface-container-low"
            } transition-colors rounded-DEFAULT font-label-sm text-label-sm disabled:opacity-50`}
            title={user.isActive ? "Deactivate" : "Activate"}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              data-icon={user.isActive ? "block" : "check_circle"}
            >
              {user.isActive ? "block" : "check_circle"}
            </span>
            {user.isActive ? "Deactivate" : "Activate"}
          </button>
          {!user.isActive && (
            <button
              onClick={onDelete}
              disabled={isPending}
              className="p-1.5 text-error hover:text-error hover:bg-error-container/20 transition-colors rounded-DEFAULT disabled:opacity-50"
              title="Permanently Delete User"
            >
              <span className="material-symbols-outlined text-[18px]" data-icon="delete_forever">
                delete_forever
              </span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function MobileUserCard({
  user,
  onToggleStatus,
  onDelete,
  onEdit,
  isPending,
}: {
  user: UserProfile;
  onToggleStatus: () => void;
  onDelete: () => void;
  onEdit: () => void;
  isPending: boolean;
}) {
  const getInitials = (name: string) => {
    return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
  };
  const isStudent = user.role === "STUDENT";
  const isFaculty = user.role === "FACULTY";

  return (
    <div className="p-4 flex flex-col gap-4 bg-surface-container-lowest hover:bg-surface-container-low/20 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-full shrink-0 ${
                isStudent
                  ? "bg-primary-container text-on-primary"
                  : isFaculty
                  ? "bg-tertiary-container text-on-tertiary"
                  : "bg-secondary-container text-on-secondary-container"
              } flex items-center justify-center font-bold text-sm`}
            >
              {getInitials(user.name)}
            </div>
          )}
          <div>
            <div className="font-medium text-on-surface leading-tight">{user.name}</div>
            <div className="text-xs text-on-surface-variant mt-0.5">{user.email}</div>
          </div>
        </div>
        <span
          className={`inline-flex items-center px-2 py-1 rounded-DEFAULT shrink-0 ${
            user.isActive
              ? "bg-[#F0F9FF] text-[#0284C7]"
              : "bg-surface-variant text-on-surface-variant"
          } font-label-sm text-[10px]`}
        >
          {user.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-on-surface-variant text-xs block mb-0.5">Role</span>
          <span className="capitalize text-on-surface font-medium">{user.role.toLowerCase()}</span>
        </div>
        <div>
          <span className="text-on-surface-variant text-xs block mb-0.5">Department</span>
          <span className="text-on-surface font-medium truncate">{user.department || "—"}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/30 mt-1">
        {!isStudent && (
          <button
            onClick={onEdit}
            className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-DEFAULT hover:bg-surface-container-low"
            title="Edit Password"
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="edit">edit</span>
          </button>
        )}
        <button
          onClick={onToggleStatus}
          disabled={isPending}
          className={`flex items-center gap-1 px-3 py-2 ${
            user.isActive
              ? "text-error hover:bg-error-container/20"
              : "text-on-surface-variant hover:bg-surface-container-low"
          } transition-colors rounded-DEFAULT font-label-sm text-sm disabled:opacity-50`}
          title={user.isActive ? "Deactivate" : "Activate"}
        >
          <span className="material-symbols-outlined text-[20px]" data-icon={user.isActive ? "block" : "check_circle"}>
            {user.isActive ? "block" : "check_circle"}
          </span>
          <span className="hidden sm:inline">{user.isActive ? "Deactivate" : "Activate"}</span>
        </button>
        {!user.isActive && (
          <button
            onClick={onDelete}
            disabled={isPending}
            className="p-2 text-error hover:text-error hover:bg-error-container/20 transition-colors rounded-DEFAULT disabled:opacity-50"
            title="Permanently Delete User"
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="delete_forever">delete_forever</span>
          </button>
        )}
      </div>
    </div>
  );
}

function EditUserModal({ 
  user, 
  onClose,
  onSuccess
}: { 
  user: UserProfile | null, 
  onClose: () => void,
  onSuccess: () => void
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!user) return null;

  const passwordsMatch = newPassword === confirmPassword;
  const isValidLength = newPassword.length >= 6;
  const isFormValid = isValidLength && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      if (!isValidLength) toast.error("Password must be at least 6 characters.");
      else if (!passwordsMatch) toast.error("Passwords do not match.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      
      toast.success("Password reset successfully.");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={!!user} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-container-lowest p-6 rounded-xl shadow-lg z-50 w-[calc(100%-2rem)] max-w-md max-h-[90vh] overflow-y-auto border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl font-bold">Edit User</Dialog.Title>
            <Dialog.Close className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined">close</span>
            </Dialog.Close>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-on-surface-variant">Resetting password for:</p>
            <div className="font-medium">{user.name}</div>
            <div className="text-xs text-on-surface-variant capitalize">{user.role.toLowerCase()}</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Enter new password (min 6 chars)"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-3 pr-10 py-2 border rounded-md focus:outline-none focus:ring-1 ${
                    confirmPassword.length > 0 && !passwordsMatch 
                      ? "border-error focus:ring-error" 
                      : "focus:ring-primary"
                  }`}
                  placeholder="Confirm your new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-error mt-1">Passwords do not match</p>
              )}
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-md text-sm hover:bg-surface-container-low"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Password"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
