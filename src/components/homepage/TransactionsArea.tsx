import Image from "next/image";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Transaction } from "@/app/page";
import { DateTime } from "luxon";
import { Euro } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "../ui/separator";

export type TransactionCardProps = {
  transactions: Transaction[];
};

export function TransactionsArea(props: TransactionCardProps) {
  const { transactions } = props;
  const isMobile = useIsMobile();

  return (
    <>
      {transactions.map((transaction, idx) => (
        <div key={transaction.id} className="mb-5">
          {(idx === 0 ||
            DateTime.fromISO(transactions[idx - 1].timestamp, {
              zone: "UTC",
            }).setZone("Europe/Berlin").day !==
              DateTime.fromISO(transaction.timestamp, { zone: "UTC" }).setZone(
                "Europe/Berlin"
              ).day) && (
            <div className="flex w-full justify-evenly -mt-5">
              <Separator className="flex-1 self-center" />
              <span className="m-5 text-muted-foreground">
                {DateTime.fromISO(transaction.timestamp, {
                  zone: "UTC",
                })
                  .setZone("Europe/Berlin")
                  .toFormat("EEEE, dd.LL.yyyy")}
              </span>
              <Separator className="flex-1 self-center" />
            </div>
          )}
          <Card>
            <div
              className="flex flex-row"
              style={{
                display: "grid",
                gridTemplateAreas: !isMobile
                  ? `"left . image date"
                   "left . image ."
                   "left . image ."`
                  : `"left . . date" 
                   "left . . image"
                   "left . . image"`,
                gridTemplateColumns: "auto max-content auto min-content",
                rowGap: "3em",
              }}
            >
              <div
                className="flex flex-col place-content-between justify-self-start"
                style={{ gridArea: "left" }}
              >
                <CardHeader>
                  <CardTitle
                    className={transaction.deleted ? "text-muted" : undefined}
                    style={
                      transaction.deleted
                        ? {
                            textDecorationLine: "line-through",
                            textDecorationThickness: "2pt",
                          }
                        : undefined
                    }
                  >
                    {transaction.offeringId !== "topup"
                      ? transaction.readableName
                      : transaction.pricePaidCents < 0
                      ? "Aufladung"
                      : "Ausbuchung"}
                  </CardTitle>

                  <CardDescription
                    style={
                      transaction.deleted
                        ? {
                            textDecorationLine: "line-through",
                            textDecorationThickness: "1pt",
                          }
                        : undefined
                    }
                    className={transaction.deleted ? "text-muted" : undefined}
                  >
                    authorized by{" "}
                    <span
                      className={
                        transaction.deleted
                          ? "text-muted"
                          : "text-accent-foreground"
                      }
                    >
                      @{transaction.adminUsername}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <span
                    className={`text-3xl font-extrabold${
                      transaction.deleted ? " text-muted" : ""
                    }`}
                    style={
                      transaction.deleted
                        ? {
                            textDecorationLine: "line-through",
                            textDecorationThickness: "5pt",
                          }
                        : undefined
                    }
                  >
                    {new Intl.NumberFormat("de-DE", {
                      style: "currency",
                      currency: "EUR",
                    }).format(
                      (transaction.offeringId === "topup"
                        ? -1 * transaction.pricePaidCents
                        : transaction.pricePaidCents) / 100
                    )}
                  </span>
                </CardFooter>
              </div>

              {!transaction.deleted && (
                <div
                  className="flex items-center justify-right group justify-end"
                  style={{ gridArea: "image" }}
                >
                  <div
                    className={`flex relative items-center justify-center ${
                      isMobile ? " right-2" : ""
                    }`}
                  >
                    <Image
                      className="relative group-hover:animate-spin-slow-pulsate-cw max-w-none"
                      src={{ src: "/star.svg", height: 150, width: 150 }}
                      alt="decorative star"
                    />
                    <Image
                      className="absolute group-hover:animate-spin-slow-ccw max-w-none"
                      src={{ src: "/star2.svg", height: 135, width: 135 }}
                      alt="decorative star2"
                    />
                    {transaction.offeringId !== "topup" ? (
                      <Image
                        className="rotate-25 group-hover:animate-wiggle absolute max-w-none"
                        src={{
                          src: transaction.imageUrl,
                          height: 120,
                          width: 120,
                        }}
                        alt={transaction.offeringId}
                      />
                    ) : (
                      <Euro
                        height={120}
                        width={120}
                        className="text-background rotate-25 group-hover:animate-wiggle absolute max-w-none"
                      />
                    )}
                  </div>
                </div>
              )}

              <div
                className={`text-xs text-muted${
                  transaction.deleted ? "" : "-foreground"
                } px-6 justify-self-end whitespace-nowrap`}
                style={
                  transaction.deleted
                    ? {
                        textDecorationLine: "line-through",
                        textDecorationThickness: "1pt",
                        gridArea: "date",
                      }
                    : {
                        gridArea: "date",
                      }
                }
              >
                {DateTime.fromISO(transaction.timestamp, {
                  zone: "UTC",
                })
                  .setZone("Europe/Berlin")
                  .toFormat("dd.LL.yyyy - HH:mm")}
              </div>
            </div>
          </Card>
        </div>
      ))}
    </>
  );
}
