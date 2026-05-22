import AdminCreateStaffPage from "./AdminCreateStaffPage";

export default function AdminCreateRegistrar() {
  return (
    <AdminCreateStaffPage
      title="Invite Registrar"
      roleLabel="Registrar"
      defaultDepartment="Registrar"
      callableName="createRegistrarInvite"
      successRedirect="/admin/manage-administrators/registrar"
      backPath="/admin/manage-administrators/registrar"
    />
  );
}