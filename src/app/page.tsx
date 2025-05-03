import Image from "next/image";
import Link from "next/link";
import {
  FaUsers,
  FaShoppingCart,
  FaWallet,
  FaChartLine,
  FaLeaf,
  FaHandHoldingHeart,
  FaStar,
  FaArrowRight,
  FaFacebook,
  FaInstagram,
  FaTwitter
} from "react-icons/fa";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <img src="/logo.svg" alt="Extreme Life Herbal Products Logo" className="h-10 w-10 mr-2" />
                <h1 className="text-xl font-semibold text-green-700">Extreme Life Herbal</h1>
              </Link>
            </div>
            <div className="flex items-center">
              <Link href="/login" className="px-4 py-2 bg-green-600 text-white rounded-md mr-2 hover:bg-green-700">
                Sign In
              </Link>
              <Link href="/register" className="px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50">
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
              <span className="text-green-600">Nature's Healing Power</span> in Every Product
            </h1>
            <p className="mt-5 text-xl text-gray-600">
              Discover the power of Philippine herbal medicine with our premium organic products. Join our community and earn while promoting health and wellness.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/register" className="inline-block px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 md:text-lg">
                Become a Distributor
              </Link>
              <Link href="/about" className="inline-block px-8 py-3 border border-green-600 text-base font-medium rounded-md text-green-600 bg-white hover:bg-green-50 md:text-lg">
                Learn More
              </Link>
            </div>
          </div>
          <div className="mt-12 lg:mt-0 lg:w-1/2 relative">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-yellow-400 rounded-full opacity-20"></div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-green-400 rounded-full opacity-20"></div>
            <Image
              src="/about-image.jpg"
              alt="Extreme Life Herbal Products"
              width={600}
              height={400}
              className="rounded-lg shadow-xl relative z-10"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Our Premium Products
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
              Discover the healing power of Philippine herbal medicine
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:transform hover:scale-105">
                <div className="h-48 bg-green-100 relative">
                  <Image
                    src="/products/moringa.jpg"
                    alt="Premium Moringa Capsules"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Premium Moringa Capsules</h3>
                  <p className="text-gray-600 mb-4">
                    High-potency Moringa Oleifera capsules packed with essential nutrients and antioxidants.
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 font-bold">₱1,200.00</span>
                    <Link href="/products" className="text-green-600 hover:text-green-800 flex items-center">
                      Learn More <FaArrowRight className="ml-1" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:transform hover:scale-105">
                <div className="h-48 bg-green-100 relative">
                  <Image
                    src="/products/tea.jpg"
                    alt="Sambong-Banaba Tea"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Sambong-Banaba Tea</h3>
                  <p className="text-gray-600 mb-4">
                    Traditional herbal tea blend that helps support healthy blood sugar levels and kidney function.
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 font-bold">₱850.00</span>
                    <Link href="/products" className="text-green-600 hover:text-green-800 flex items-center">
                      Learn More <FaArrowRight className="ml-1" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:transform hover:scale-105">
                <div className="h-48 bg-green-100 relative">
                  <Image
                    src="/products/mangosteen.jpg"
                    alt="Mangosteen Extract"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Mangosteen Extract</h3>
                  <p className="text-gray-600 mb-4">
                    Pure mangosteen extract known for its powerful anti-inflammatory and antioxidant properties.
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 font-bold">₱1,500.00</span>
                    <Link href="/products" className="text-green-600 hover:text-green-800 flex items-center">
                      Learn More <FaArrowRight className="ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link href="/products" className="inline-block px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 md:text-lg">
                View All Products
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-green-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              How Our Business Works
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
              Join our community and earn while promoting health and wellness
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="pt-6">
                <div className="flow-root bg-white rounded-lg px-6 pb-8 h-full shadow-lg">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-green-600 rounded-md shadow-lg">
                        <FaUsers className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Build Your Team</h3>
                    <p className="mt-5 text-base text-gray-600">
                      Invite friends and family to join your downline and earn from their purchases up to 10 levels deep.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-white rounded-lg px-6 pb-8 h-full shadow-lg">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-green-600 rounded-md shadow-lg">
                        <FaShoppingCart className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Premium Products</h3>
                    <p className="mt-5 text-base text-gray-600">
                      Offer high-quality herbal products that deliver real health benefits to your customers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-white rounded-lg px-6 pb-8 h-full shadow-lg">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-green-600 rounded-md shadow-lg">
                        <FaChartLine className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Earn Rebates</h3>
                    <p className="mt-5 text-base text-gray-600">
                      Earn percentage-based or fixed amount rebates from your downline's purchases at every level.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-white rounded-lg px-6 pb-8 h-full shadow-lg">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-green-600 rounded-md shadow-lg">
                        <FaWallet className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Rank Advancement</h3>
                    <p className="mt-5 text-base text-gray-600">
                      Advance through our rank system to unlock higher rebate percentages and exclusive bonuses.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              What Our Customers Say
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
              Real stories from people who have experienced the benefits of our products
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-green-500">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <Image
                      src="/testimonials/testimonial1.jpg"
                      alt="Maria Santos"
                      width={60}
                      height={60}
                      className="rounded-full"
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">Maria Santos</h3>
                    <p className="text-gray-500">Quezon City</p>
                    <div className="flex mt-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className="h-4 w-4 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "Extreme Life Herbal Products changed my life! After using their Moringa supplements for 3 months, my energy levels improved dramatically and my blood pressure is now under control."
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-green-500">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <Image
                      src="/testimonials/testimonial2.jpg"
                      alt="Juan Dela Cruz"
                      width={60}
                      height={60}
                      className="rounded-full"
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">Juan Dela Cruz</h3>
                    <p className="text-gray-500">Cebu City</p>
                    <div className="flex mt-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className="h-4 w-4 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "I've been a distributor for Extreme Life for 2 years now. Not only have their products helped my family's health, but the business opportunity has provided additional income for my children's education."
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-green-500">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <Image
                      src="/testimonials/testimonial3.jpg"
                      alt="Angelica Reyes"
                      width={60}
                      height={60}
                      className="rounded-full"
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">Angelica Reyes</h3>
                    <p className="text-gray-500">Davao City</p>
                    <div className="flex mt-1">
                      {[...Array(4)].map((_, i) => (
                        <FaStar key={i} className="h-4 w-4 text-yellow-400" />
                      ))}
                      {[...Array(1)].map((_, i) => (
                        <FaStar key={i} className="h-4 w-4 text-gray-300" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "Their Sambong-Banaba tea is amazing! It helped me manage my blood sugar levels naturally. The customer service is also excellent - they always respond quickly to my questions."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Join Our Growing Family</h2>
          <p className="text-white text-lg mb-8 max-w-3xl mx-auto">
            Become a distributor today and start your journey towards health, wellness, and financial freedom with Extreme Life Herbal Products.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/register" className="px-8 py-3 bg-white text-green-700 font-bold rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-700">
              Become a Distributor
            </Link>
            <Link href="/about" className="px-8 py-3 bg-transparent text-white border-2 border-white font-bold rounded-md hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-700">
              Learn More About Us
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center mb-4">
                <img src="/logo.svg" alt="Extreme Life Herbal Products Logo" className="h-10 w-10 mr-2" />
                <h3 className="text-lg font-semibold">Extreme Life Herbal</h3>
              </div>
              <p className="text-gray-400">
                Nature's Healing Power in Every Product
              </p>
              <div className="mt-4 flex space-x-4">
                <a href="https://facebook.com/extremelifeherbalproducts" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <FaFacebook className="h-6 w-6" />
                </a>
                <a href="https://instagram.com/extremelifeherbal" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <FaInstagram className="h-6 w-6" />
                </a>
                <a href="https://twitter.com/extremelifeherb" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <FaTwitter className="h-6 w-6" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/login" className="text-gray-400 hover:text-white">Login</Link></li>
                <li><Link href="/register" className="text-gray-400 hover:text-white">Register</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
                <li><Link href="/products" className="text-gray-400 hover:text-white">Products</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Business</h3>
              <ul className="space-y-2">
                <li><Link href="/dashboard" className="text-gray-400 hover:text-white">Distributor Dashboard</Link></li>
                <li><Link href="/genealogy" className="text-gray-400 hover:text-white">Genealogy</Link></li>
                <li><Link href="/rebates" className="text-gray-400 hover:text-white">Rebates</Link></li>
                <li><Link href="/rank-advancement" className="text-gray-400 hover:text-white">Rank Advancement</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <p className="text-gray-400">
                123 Herbal Street, Barangay Health<br />
                Quezon City, Metro Manila<br />
                Philippines 1100<br /><br />
                Phone: +63 (2) 8123 4567<br />
                Email: info@extremelifeherbal.ph
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Extreme Life Herbal Products. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
