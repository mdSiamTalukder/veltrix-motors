import VehicleDetails from "./vehicle-details";

export const instant = false;

export default async function VehicleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <VehicleDetails id={id} />;
}
