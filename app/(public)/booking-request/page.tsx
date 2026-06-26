import { redirect } from "next/navigation";

export default function BookingRequestPage() {
  redirect("/contact?service=general&source=booking-request");
}
