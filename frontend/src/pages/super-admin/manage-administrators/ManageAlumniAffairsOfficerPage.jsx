import DepartmentAdminTablePage from "./DepartmentAdminTablePage";

export default function ManageAlumniAffairsOfficerPage() {
  return (
    <DepartmentAdminTablePage
      title="Manage Alumni Affairs Officer"
      departmentName="Alumni Affairs Officer"
      createPath="/admin/manage-administrators/alumni-affairs-officer/create"
    />
  );
}
