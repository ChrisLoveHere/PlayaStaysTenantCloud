import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ExportCsvButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={href} target="_blank" rel="noopener noreferrer">
        {label}
      </Link>
    </Button>
  );
}
