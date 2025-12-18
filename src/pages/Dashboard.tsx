import React from "react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">
            Here’s a snapshot of your internship search
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Applications", value: 0 },
            { label: "In Progress", value: 0 },
            { label: "Interviews", value: 0 },
            { label: "Offers", value: 0 },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button className="px-5 py-3 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-900">
            + Add Internship
          </button>
          <button className="px-5 py-3 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100">
            View All Applications
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Applications
              </h2>
              <span className="text-sm text-gray-500 cursor-pointer hover:underline">
                View all
              </span>
            </div>

            <div className="text-center py-12">
              <p className="text-sm text-gray-500">
                You haven’t added any internships yet.
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Start tracking to see them here.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Needs Attention
            </h2>

            <div className="text-sm text-gray-500">
              <p>No urgent tasks right now</p>
              <p className="text-gray-400 mt-1">
                Interviews and deadlines will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
