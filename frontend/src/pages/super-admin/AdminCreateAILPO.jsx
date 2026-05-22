import AdminCreateStaffPage from "./AdminCreateStaffPage";

export default function AdminCreateAILPO() {
  return (
    <AdminCreateStaffPage
      title="Invite AILPO"
      roleLabel="AILPO"
      defaultDepartment="Academe Industry Linkage and Placement Office"
      callableName="createAILPOInvite"
      successRedirect="/admin/manage-administrators/ailpo"
      backPath="/admin/manage-administrators/ailpo"
      showDepartmentTitleField
      departmentTitleLabel="Department Title"
      departmentTitleOptions={[
        "Placement Officer",
        "Internship Officer",
        "Linkage Officer",
        "Head of Academe Industry Linkage and Placement Office",
      ]}
    />
  );
}