import AdminCreateStaffPage from "./AdminCreateStaffPage";

export default function AdminCreateAlumniOfficer() {
  return (
    <AdminCreateStaffPage
      title="Invite Alumni Affairs Officer"
      roleLabel="Alumni Officer"
      defaultDepartment="Alumni Affairs Office"
      callableName="createAlumniOfficerInvite"
      successRedirect="/admin/manage-administrators/alumni-affairs-officer"
      backPath="/admin/manage-administrators/alumni-affairs-officer"
      showDepartmentTitleField
      departmentTitleLabel="Department Title"
      departmentTitleOptions={[
        "Head of Alumni Affairs Office",
        "Alumni Marketing Officer",
      ]}
    />
  );
}