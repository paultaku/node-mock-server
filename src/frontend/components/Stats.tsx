import React from "react";
import { Stats } from "../types";

interface StatsProps {
  stats: Stats;
}

export const StatsComponent: React.FC<StatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
      <div className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow">
        <div className="text-3xl font-bold text-primary-600 mb-2">
          {stats.total}
        </div>
        <div className="text-gray-600 text-sm">Total Endpoints</div>
      </div>
      <div className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow">
        <div className="text-3xl font-bold text-success-600 mb-2">
          {stats.get}
        </div>
        <div className="text-gray-600 text-sm">GET Requests</div>
      </div>
      <div className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow">
        <div className="text-3xl font-bold text-warning-600 mb-2">
          {stats.post}
        </div>
        <div className="text-gray-600 text-sm">POST Requests</div>
      </div>
      <div className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow">
        <div className="text-3xl font-bold text-warning-600 mb-2">
          {stats.put}
        </div>
        <div className="text-gray-600 text-sm">PUT Requests</div>
      </div>
      <div className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow">
        <div className="text-3xl font-bold text-error-600 mb-2">
          {stats.delete}
        </div>
        <div className="text-gray-600 text-sm">DELETE Requests</div>
      </div>
    </div>
  );
};
