import DepartmentAdminTablePage from "./DepartmentAdminTablePage";

export default function ManageRegistrarPage() {
  return (
    <DepartmentAdminTablePage
      title="Manage Registrar"
      departmentName="Registrar"
      createPath="/admin/manage-administrators/registrar/create"
    />
  );
}
