'use client';

import React from 'react';
import { Apple, MessageCircle, Linkedin, Instagram } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-5 gap-8 mb-12 lg:grid-cols-2 md:grid-cols-1">
          {/* Column 1: Logo and App */}
          <div>
            <div className="text-xl font-bold text-black mb-6">BLYSS</div>
            <button className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors w-full">
              Get the app
            </button>
            <div className="mt-3 space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Apple size={16} />
                <span>Download on App Store</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📱</span>
                <span>Get on Google Play</span>
              </div>
            </div>
          </div>

          {/* Column 2: About */}
          <div>
            <h3 className="font-semibold text-black mb-4">About</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Careers
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Help
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Sitemap
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: For Business */}
          <div>
            <h3 className="font-semibold text-black mb-4">For Business</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Partners
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Support
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Status
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h3 className="font-semibold text-black mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Terms of Use
                </a>
              </li>
            </ul>
          </div>

          {/* Column 5: Find us on */}
          <div>
            <h3 className="font-semibold text-black mb-4">Find us on</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-black transition-colors flex items-center gap-2"
                >
                  <Linkedin size={16} />
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-black transition-colors flex items-center gap-2"
                >
                  <Instagram size={16} />
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8 flex justify-between items-center">
          <p className="text-sm text-gray-600">© 2026 Blyss</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Language:</span>
            <select className="text-sm text-gray-600 bg-transparent border border-gray-300 rounded px-2 py-1 hover:border-gray-400 transition-colors">
              <option value="ru">Русский</option>
              <option value="uz">O&apos;zbekcha</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
};
