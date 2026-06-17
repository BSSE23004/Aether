import React from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

const Dashboard = () => {
  return (
    <ProtectedRoute>
      <div>
        <h1>Welcome to the Dashboard</h1>
        {/* Add dashboard content here */}
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;