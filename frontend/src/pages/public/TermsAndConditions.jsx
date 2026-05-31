import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TermsAndConditions() {
  return (
    <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto rounded-2xl">
      <DialogHeader>
        <DialogTitle>Terms & Conditions</DialogTitle>
        <DialogDescription>
          Please read these terms carefully before creating or using your NUAI
          account.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5 text-sm leading-7 text-black/70">
        <Intro>
          These Terms & Conditions govern the use of the National University
          Alumni Information System (NUAI) by authorized users, including
          administrators, AILPO personnel, alumni officers, alumni, interns,
          partners, faculty, and other approved staff accounts. By creating,
          activating, or using an account, you agree to use the system
          responsibly, lawfully, and only for legitimate NUAI-related purposes.
        </Intro>

        <Section title="1. Eligibility and Authorized Access">
          Access to NUAI is limited to verified users whose identity, role, or
          organization has been recognized by National University – MOA or its
          authorized offices. Accounts may be assigned to administrators, staff,
          alumni, interns, partner representatives, and other approved users
          depending on their role in the system.
        </Section>

        <Section title="2. Accuracy of Information">
          You agree to provide accurate, complete, and current information when
          registering, activating, updating a profile, uploading documents,
          submitting requests, or completing system forms. False, misleading, or
          incomplete information may result in review, denial, suspension,
          revocation of access, or other appropriate administrative action.
        </Section>

        <Section title="3. Account Responsibility and Security">
          You are responsible for keeping your login credentials confidential.
          You must not share your account, allow unauthorized access, or use
          another person’s account. Any activity performed under your account may
          be treated as your responsibility unless proven otherwise.
        </Section>

        <Section title="4. Role-Based Use of the System">
          NUAI provides different permissions depending on user roles. Users
          must only access, process, upload, approve, deny, edit, or manage
          information that is allowed for their assigned role. Attempting to
          bypass permissions, access restricted records, or perform unauthorized
          actions is prohibited.
        </Section>

        <Section title="5. Acceptable Use">
          You agree to use NUAI only for legitimate university, alumni,
          internship, employment, partner coordination, survey, communication,
          document processing, and system administration purposes. The system
          must not be used for fraud, harassment, spam, unauthorized data
          collection, impersonation, or activities unrelated to NUAI operations.
        </Section>

        <Section title="6. Documents, Uploads, and Submitted Records">
          Documents uploaded to NUAI, including registration documents, profile
          requirements, Memorandum of Agreement files, renewal letters, images,
          and other supporting records, must be authentic, relevant, and lawful.
          Uploaded files may be reviewed, approved, denied, archived, or removed
          when necessary for verification, security, or policy compliance.
        </Section>

        <Section title="7. Partner Access, MOA, and Contract Validity">
          Partner accounts are subject to registration review, activation,
          profile completion, Memorandum of Agreement preparation, document
          review, approval, and contract validity monitoring. Partner access may
          be granted, denied, suspended, removed, renewed, or allowed to expire
          depending on the status of submitted documents, MOA approval, contract
          duration, and compliance with NUAI requirements.
        </Section>

        <Section title="8. Alumni and Intern Records">
          Alumni and intern users are responsible for keeping their personal,
          contact, academic, employment, and profile-related information updated
          when required. Some information may be verified against existing
          university records. Required profile, survey, transition, or
          employment-related forms may be requested to maintain accurate alumni
          and intern records.
        </Section>

        <Section title="9. Administrative and Officer Responsibilities">
          Administrators, AILPO personnel, alumni officers, faculty, registrar,
          treasury, and other staff users must handle system records with care,
          confidentiality, and accountability. Actions such as approving,
          denying, updating, exporting, uploading, or reviewing records must be
          done only for authorized institutional purposes.
        </Section>

        <Section title="10. Data Privacy and Confidentiality">
          NUAI may collect and process personal information, contact details,
          profile data, academic records, employment information, uploaded
          documents, system activity, and related records necessary for system
          operations. Users must respect the confidentiality of any information
          they access and must not disclose, copy, download, or distribute data
          without proper authority.
        </Section>

        <Section title="11. Verification, Review, and Audit">
          NUAI reserves the right to verify submitted information, review
          uploaded documents, monitor account status, and keep audit records of
          important system actions. This helps protect the integrity, security,
          and accountability of the platform.
        </Section>

        <Section title="12. Denial, Suspension, Removal, and Revocation">
          Access may be denied, suspended, limited, removed, or revoked if a user
          violates these terms, submits invalid information, misuses the system,
          fails verification, breaches confidentiality, or no longer meets the
          requirements for continued access.
        </Section>

        <Section title="13. System Availability and Changes">
          The university may update, modify, suspend, improve, or restrict NUAI
          features at any time to maintain security, performance, reliability,
          compliance, and proper system operation. Some features may change based
          on institutional requirements.
        </Section>

        <Section title="14. User Acknowledgment">
          By continuing to use NUAI, you confirm that you have read,
          understood, and agreed to these Terms & Conditions. You also agree to
          follow applicable university policies, data privacy obligations, and
          role-based responsibilities while using the system.
        </Section>

        <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs leading-6 text-muted-foreground">
          This document is intended for system use and academic project
          implementation. For official legal enforcement, the university may
          require review and approval by authorized legal or administrative
          personnel.
        </div>
      </div>
    </DialogContent>
  );
}

function Intro({ children }) {
  return (
    <div className="rounded-xl border border-[#3D398C]/15 bg-[#3D398C]/5 p-4">
      <p className="text-sm leading-7 text-black/70">{children}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-1">
      <h4 className="font-bold text-nu-blue">{title}</h4>
      <p>{children}</p>
    </section>
  );
}