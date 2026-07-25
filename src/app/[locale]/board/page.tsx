import { redirect } from "@/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function BoardRedirectPage({ params }: Props) {
  const { locale } = await params;
  redirect({ href: "/dashboard/board", locale });
}
