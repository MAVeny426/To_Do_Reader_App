import React, { useEffect, useState } from 'react';
import Navbar from '../Components/Navbar';

const AvatarPage = () => {
  const [profile,setProfile] = useState(null);
  const [completedAssignedTasks, setCompletedAssignedTasks] = useState([]); 
  const [userEmail,setUserEmail] = useState(''); 
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(null);

  useEffect(() => {
    const fetchUserProfileAndTasks = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token'); 

      if (!token || token.trim() === '') {
        setError('No authentication token found or token is empty. Please log in.');
        setLoading(false);
        return;
      }
      if (user && user.email) {
        setUserEmail(user.email);
      }

      try {
        const userRes = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          setProfile({
            name: userData.name || 'N/A',
            role: userData.role || 'User',
            email: userData.email || 'N/A',
            joined: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { year:'numeric',month: 'long' }) : 'N/A',
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${userData.name || userData.email}`,
          });
        } else {
          const errorData = await userRes.json();
          setError(errorData.msg || 'Failed to fetch profile data.');
        }

        const completedTasksRes = await fetch('/api/tasks/mycompleted', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          }
        });

        if (completedTasksRes.ok) {
          const completedTasksData = await completedTasksRes.json();
          setCompletedAssignedTasks(completedTasksData); 
        } else {
          console.error('Failed to fetch completed tasks:', await completedTasksRes.text());
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Network error or server is unreachable. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfileAndTasks();
  }, []);

  return (
    <>
    <Navbar/>
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-black p-6 font-inter text-white">
      {loading ? (
        <div className="text-gray-300 text-xl animate-pulse">Loading profile and tasks...</div>
      ) : error ? (
        <div className="max-w-xl w-full bg-red-800 border-l-8 border-red-500 text-white p-6 rounded-lg shadow-xl animate-fadeInUp">
          <p className="font-bold text-2xl mb-2">Error:</p>
          <p className="text-lg">{error}</p>
          <p className="mt-4 text-sm opacity-80">Please ensure you are logged in and the backend server is running.</p>
        </div>
      ) : (
        <>
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 mb-10 animate-fadeInUp transition-all duration-700 ease-in-out transform hover:scale-[1.01] border border-purple-400">
            <div className="flex flex-col items-center text-center text-gray-900">
              <img
                src={profile.avatar}
                alt="avatar"
                className="w-32 h-32 rounded-full border-6 border-purple-600 shadow-lg transition-transform hover:scale-105 duration-300 ease-in-out object-cover"
              />
              <h2 className="text-3xl font-extrabold mt-5 text-gray-900">{profile.name}</h2>
              <p className="text-md text-purple-700 font-semibold mt-1">{profile.role}</p>
              {/* <p className="mt-3 text-gray-700 text-lg">{profile.email}</p> */}
              {/* <p className="mt-2 text-sm text-gray-500">Joined: {profile.joined}</p> */}
              {/* Display Connected Account Email */}
              {userEmail && (
                <p className="mt-4 text-lg font-bold text-blue-700">
                  Email: <span className="font-extrabold">{userEmail}</span>
                </p>
              )}
            </div>
          </div>

        </>
      )}
    </div>
    </>
  );
};

export default AvatarPage;
