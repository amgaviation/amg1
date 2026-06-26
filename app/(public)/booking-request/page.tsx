import RequestSupportPage, { metadata } from "@/app/(public)/request-support/page";

export { metadata };

export default function BookingRequestPage(props: Parameters<typeof RequestSupportPage>[0]) {
  return <RequestSupportPage {...props} />;
}
