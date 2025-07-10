import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    navigate('/'); 
  };

  return (
    <nav className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold tracking-wide">
          <Link to="/" className="hover:text-purple-300 transition duration-300 ease-in-out">
            TaskFlow
          </Link>
        </div>
        <div className="space-x-6 flex items-center">
          <Link
            to="/kanbanboard"
            className="hover:text-yellow-300 transition duration-300 ease-in-out font-medium"
          >
            Kanban Board
          </Link>
          <Link
            to="/taskviewer"
            className="hover:text-yellow-300 transition duration-300 ease-in-out font-medium"
          >
            Task Viewer
          </Link>
          <Link
            to="/avatarpage"
            className="hover:text-yellow-300 transition duration-300 ease-in-out font-medium"
          >
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition duration-300 ease-in-out font-semibold shadow-md"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
