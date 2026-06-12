import { redirect } from "next/navigation";

export const metadata = {
  title: "Request AMG Portal Access",
  description: "Request access to the AMG Aviation Group portal.",
};

export default function SignupPage() {
  redirect("/login?mode=request");
}
