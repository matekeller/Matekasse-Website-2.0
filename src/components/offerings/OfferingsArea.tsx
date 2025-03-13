"use client";
import { DBOffering } from "@/app/db/db";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import Image from "next/image";
import { Separator } from "../ui/separator";

export type OfferingsAreaProps = {
  offerings: DBOffering[];
};

export function OfferingsArea(props: OfferingsAreaProps) {
  let { offerings } = props;

  const offeringsDiscontinued = offerings.filter(
    (offering) => offering.discontinued
  );

  offerings = offerings.filter((offering) => !offering.discontinued);

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(clamp(0px, 350px, 100%), 1fr))",
          gap: "1em",
        }}
      >
        {getCards(offerings)}
      </div>

      {offeringsDiscontinued.length !== 0 && (
        <div className="flex w-full justify-evenly">
          <Separator className="flex-1 self-center" />
          <span className="m-5">Discontinued offerings</span>
          <Separator className="flex-1 self-center" />
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(clamp(0px, 350px, 100%), 1fr))",
          gap: "1em",
        }}
      >
        {getCards(offeringsDiscontinued)}
      </div>
    </>
  );
}

const getCards = (offerings: DBOffering[]) => {
  return offerings.map((offering) => (
    <Card
      key={offering.name}
      className="grid flex-row"
      style={{ gridTemplateColumns: "auto auto" }}
    >
      <div className="flex flex-col justify-between">
        <CardHeader>
          <CardTitle>{offering.readableName}</CardTitle>
          <CardDescription>
            Currently in stock: {offering.inInventory}
          </CardDescription>
        </CardHeader>

        <CardFooter>
          <span
            className={`text-3xl font-extrabold ${
              offering.discounted && !offering.discontinued
                ? "text-red-700"
                : "text-foreground"
            }`}
          >
            {new Intl.NumberFormat("de-DE", {
              style: "currency",
              currency: "EUR",
            }).format(offering.priceCents / 100)}
          </span>
        </CardFooter>
      </div>

      <div className="flex items-center justify-right group justify-end">
        <div className="flex relative items-center justify-center right-3">
          <Image
            className="relative group-hover:animate-spin-slow-pulsate-cw"
            src={{ src: "/star.svg", height: 150, width: 150 }}
            alt="decorative star"
          />
          <Image
            className="absolute group-hover:animate-spin-slow-ccw"
            src={{ src: "/star2.svg", height: 135, width: 135 }}
            alt="decorative star2"
          />

          <Image
            className="rotate-25 group-hover:animate-wiggle absolute"
            src={{
              src: offering.imageUrl,
              height: 120,
              width: 120,
            }}
            alt={offering.name}
          />
        </div>
      </div>
    </Card>
  ));
};
