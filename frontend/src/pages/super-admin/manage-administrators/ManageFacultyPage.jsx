import DepartmentAdminTablePage from "./DepartmentAdminTablePage";

export default function ManageFacultyPage() {
  return (
    <DepartmentAdminTablePage
      title="Manage Internship Advisers"
      departmentName="Internship Advisers"
      createPath="/admin/manage-administrators/faculty/create"
      showProgramColumn
    />
  );
}
