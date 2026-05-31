import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Policy() {
  return (
    <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Privacy Policy</DialogTitle>
        <DialogDescription>
          This explains how your registration and account information is handled
          in the NUAI system.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 text-sm leading-7 text-black/70">
        <Section title="1. Information Collected">
          NUAI may collect your student ID, NU email, registration details,
          verification data, and account credentials.
        </Section>

        <Section title="2. Purpose of Collection">
          Your information is used to verify your identity, create your account,
          improve system security, and support official NUAI services.
        </Section>

        <Section title="3. Data Protection">
          Reasonable safeguards are applied to help protect your personal
          information from unauthorized access, disclosure, alteration, or misuse.
        </Section>

        <Section title="4. Limited Sharing">
          Personal information is only accessed or shared when necessary for
          legitimate university operations, services, legal compliance, or system
          administration.
        </Section>

        <Section title="5. User Responsibility">
          You are encouraged to keep your account credentials secure and ensure
          your information remains accurate and updated.
        </Section>

        <Section title="6. Consent">
          By proceeding with registration, you consent to the collection and
          processing of your information for legitimate NUAI system purposes.
        </Section>
      </div>
    </DialogContent>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="font-bold text-nu-blue">{title}</h4>
      <p>{children}</p>
    </div>
  );
}