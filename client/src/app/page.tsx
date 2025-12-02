import Link from 'next/link';
import { MapPin, BarChart3, MessageSquare, Settings } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-landscore-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-landscore-600 flex items-center justify-center">
                <MapPin className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                LAND<span className="text-landscore-600">SCORE</span>
              </h1>
            </div>
            
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              A high-performance GIS platform for land parcel visualization, valuation analytics, 
              and AI-powered geospatial queries.
            </p>
            
            <div className="mt-10 flex justify-center gap-4">
              <Link
                href="/map"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-landscore-600 hover:bg-landscore-700 transition-colors shadow-lg shadow-landscore-600/25"
              >
                <MapPin className="h-5 w-5 mr-2" />
                Open Map
              </Link>
              <Link
                href="/analytics"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">Platform Features</h2>
          <p className="mt-4 text-lg text-gray-500">
            Everything you need for comprehensive land analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Interactive Maps
            </h3>
            <p className="text-gray-500">
              WebGL-powered map visualization with real-time parcel rendering, 
              hover effects, and detailed property information on click.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center mb-6">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Valuation Analytics
            </h3>
            <p className="text-gray-500">
              Comprehensive property valuations with price history, 
              market comparisons, and trend analysis.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              AI Assistant
            </h3>
            <p className="text-gray-500">
              Natural language queries powered by Gemini AI. Ask questions like 
              &quot;Find large agricultural plots near water sources.&quot;
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center mb-6">
              <svg className="h-6 w-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Land Data
            </h3>
            <p className="text-gray-500">
              Soil types, zoning codes, cropland classifications, 
              water access, and elevation data for every parcel.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center mb-6">
              <svg className="h-6 w-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Drawing Tools
            </h3>
            <p className="text-gray-500">
              Draw custom areas, measure distances, and save regions 
              of interest for future reference.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center mb-6">
              <Settings className="h-6 w-6 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Advanced Filters
            </h3>
            <p className="text-gray-500">
              Filter parcels by price, area, zoning, soil quality, 
              and more with our powerful search interface.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-landscore-600 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900">LANDSCORE</span>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} LANDSCORE. Built with Next.js, PostGIS & Gemini AI.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
