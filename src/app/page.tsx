import Image from "next/image";
import Link from "next/link";
import { FaUsers, FaShoppingCart, FaWallet, FaChartLine } from "react-icons/fa";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">MLM Rebate Engine</h1>
            </div>
            <div className="flex items-center">
              <Link href="/login" className="px-4 py-2 bg-blue-500 text-white rounded-md mr-2">
                Sign In
              </Link>
              <Link href="/register" className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md">
                Register
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="lg:w-1/2">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Earn Rebates on Every Purchase
            </h1>
            <p className="mt-5 text-xl text-gray-500">
              Join our MLM platform and earn rebates on your purchases and your downline's purchases up to 10 levels deep.
            </p>
            <div className="mt-10">
              <Link href="/register" className="inline-block px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:text-lg">
                Get Started
              </Link>
            </div>
          </div>
          <div className="mt-12 lg:mt-0 lg:w-1/2">
            <Image
              src="/hero-image.jpg"
              alt="MLM Rebate Engine"
              width={600}
              height={400}
              className="rounded-lg shadow-xl"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Our MLM rebate system rewards you at every level
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                        <FaUsers className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Build Your Team</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Invite friends and family to join your downline and earn from their purchases.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                        <FaShoppingCart className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Shop Products</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Purchase products and earn personal rebates on every purchase.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                        <FaChartLine className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Earn Rebates</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Earn rebates from your downline's purchases up to 10 levels deep.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                        <FaWallet className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Cash Out</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Withdraw your earnings to your bank account or use them for future purchases.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">MLM Rebate Engine</h3>
              <p className="text-gray-300">
                The most advanced MLM rebate system for your business.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/login" className="text-gray-300 hover:text-white">Login</Link></li>
                <li><Link href="/register" className="text-gray-300 hover:text-white">Register</Link></li>
                <li><Link href="/about" className="text-gray-300 hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <p className="text-gray-300">
                Email: info@mlmrebateengine.com<br />
                Phone: +1 (123) 456-7890
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-300">
            <p>&copy; {new Date().getFullYear()} MLM Rebate Engine. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
