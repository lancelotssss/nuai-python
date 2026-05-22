import DepartmentAdminTablePage from "./DepartmentAdminTablePage";

export default function ManageAilpoPage() {
  return (
    <DepartmentAdminTablePage
      title="Manage AILPO"
      departmentName="AILPO"
      createPath="/admin/manage-administrators/ailpo/create"
    />
  );
}
