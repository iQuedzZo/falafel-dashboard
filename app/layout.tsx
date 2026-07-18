import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Falafel Flare Dashboard",
  description: "Restaurant order management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">

          <aside className="w-64 bg-green-900 text-white p-6">

            <div className="mb-10">
              <h1 className="text-2xl font-bold">
                Falafel Flare
              </h1>

              <p className="text-green-200 text-sm">
                Restaurant Dashboard
              </p>
            </div>


            <nav className="space-y-3">

              <Link
                href="/"
                className="block rounded-lg p-3 hover:bg-green-800 transition"
              >
                📊 Dashboard
              </Link>


              <Link
                href="/orders"
                className="block rounded-lg p-3 hover:bg-green-800 transition"
              >
                🧾 Orders
              </Link>


              <Link
                href="/catering"
                className="block rounded-lg p-3 hover:bg-green-800 transition"
              >
                🍽 Catering
              </Link>


              <Link
                href="/settings"
                className="block rounded-lg p-3 hover:bg-green-800 transition"
              >
                ⚙️ Settings
              </Link>

            </nav>


          </aside>


          <main className="flex-1 bg-gray-100">
            {children}
          </main>


        </div>
      </body>
    </html>
  );
}