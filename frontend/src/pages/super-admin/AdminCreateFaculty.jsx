import AdminCreateStaffPage from "./AdminCreateStaffPage";

export default function AdminCreateFaculty() {
  return (
    <AdminCreateStaffPage
      title="Invite Internship Adviser"
      roleLabel="Faculty"
      defaultDepartment="Internship Adviser"
      callableName="createFacultyInvite"
      successRedirect="/admin/manage-administrators/faculty"
      backPath="/admin/manage-administrators/faculty"
      showProgramField
      showSchoolProgramField
    />
  );
}