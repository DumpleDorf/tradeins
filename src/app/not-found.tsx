import { Header } from "@/components/header";
import { NotFoundContent } from "@/components/not-found-content";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Header />
      <NotFoundContent />
    </div>
  );
}
