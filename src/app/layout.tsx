import "./globals.css";
import type { Metadata } from "next";
import { Inter, Roboto, Open_Sans, Lato, Montserrat, Poppins, Source_Sans_3, Raleway, Nunito, Playfair_Display, Merriweather, Roboto_Slab, PT_Sans, Oswald, Roboto_Condensed, Source_Serif_4, Noto_Sans, Ubuntu, Work_Sans, Quicksand, Josefin_Sans, Mukta, Rubik, IBM_Plex_Sans, Barlow, Mulish, Comfortaa, Outfit, Plus_Jakarta_Sans, Courier_Prime, IBM_Plex_Mono } from "next/font/google";
import ClientRoot from "./ClientRoot";
import AppMain from "./components/AppMain";

const inter = Inter({ subsets: ["latin"] });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "700"] });
const openSans = Open_Sans({ subsets: ["latin"], weight: ["400", "700"] });
const lato = Lato({ subsets: ["latin"], weight: ["400", "700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "700"] });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700"] });
const sourceSans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "700"] });
const raleway = Raleway({ subsets: ["latin"], weight: ["400", "700"] });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "700"] });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "700"] });
const merriweather = Merriweather({ subsets: ["latin"], weight: ["400", "700"] });
const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["400", "700"] });
const ptSans = PT_Sans({ subsets: ["latin"], weight: ["400", "700"] });
const oswald = Oswald({ subsets: ["latin"], weight: ["400", "700"] });
const robotoCondensed = Roboto_Condensed({ subsets: ["latin"], weight: ["400", "700"] });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["400", "700"] });
const notoSans = Noto_Sans({ subsets: ["latin"], weight: ["400", "700"] });
const ubuntu = Ubuntu({ subsets: ["latin"], weight: ["400", "700"] });
const workSans = Work_Sans({ subsets: ["latin"], weight: ["400", "700"] });
const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "700"] });
const josefinSans = Josefin_Sans({ subsets: ["latin"], weight: ["400", "700"] });
const mukta = Mukta({ subsets: ["latin"], weight: ["400", "700"] });
const rubik = Rubik({ subsets: ["latin"], weight: ["400", "700"] });
const ibmPlexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "700"] });
const barlow = Barlow({ subsets: ["latin"], weight: ["400", "700"] });
const mulish = Mulish({ subsets: ["latin"], weight: ["400", "700"] });
const comfortaa = Comfortaa({ subsets: ["latin"], weight: ["400", "700"] });
const outfit = Outfit({ subsets: ["latin"], weight: ["400", "700"] });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "700"] });
const courierPrime = Courier_Prime({ subsets: ["latin"], weight: ["400", "700"] });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "PromptReviews - AI Review Request App",
  description: "Generate and manage review requests for your business",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={[
        inter.className,
        roboto.className,
        openSans.className,
        lato.className,
        montserrat.className,
        poppins.className,
        sourceSans.className,
        raleway.className,
        nunito.className,
        playfair.className,
        merriweather.className,
        robotoSlab.className,
        ptSans.className,
        oswald.className,
        robotoCondensed.className,
        sourceSerif.className,
        notoSans.className,
        ubuntu.className,
        workSans.className,
        quicksand.className,
        josefinSans.className,
        mukta.className,
        rubik.className,
        ibmPlexSans.className,
        barlow.className,
        mulish.className,
        comfortaa.className,
        outfit.className,
        plusJakartaSans.className,
        courierPrime.className,
        ibmPlexMono.className,
      ].join(' ') + " min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 overscroll-x-auto"}>
        <ClientRoot>
          <AppMain>{children}</AppMain>
        </ClientRoot>
      </body>
    </html>
  );
}
