import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [messageModal, setMessageModal] = useState({
    isVisible: false,
    title: '',
    content: '',
    type: ''
  });

  const showMessageModal = (title, content, type) => {
    setMessageModal({ isVisible: true, title, content, type });
  };

  const hideMessageModal = () => {
    setMessageModal({ isVisible: false, title: '', content: '', type: '' });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        const data = await res.json();
        // Store the JWT token in localStorage
        localStorage.setItem('token', data.token);
        // Store user details (name, email)
        localStorage.setItem('user', JSON.stringify({
          name: data.user.name,
          email: data.user.email
        }));
        console.log('Logged-in user stored:', data.user);
        console.log('JWT Token stored.');

        showMessageModal('Login Successful', 'You have been successfully logged in.', 'success');
        // Navigate after a short delay to allow user to see the modal
        setTimeout(() => {
          navigate('/KanbanBoard');
        }, 1500); // Adjust delay as needed
      } else {
        const errorData = await res.json();
        showMessageModal('Login Failed', errorData.msg || 'Invalid credentials or an unexpected error occurred.', 'error');
      }
    } catch (err) {
      console.error('Login error:', err);
      showMessageModal('Login Error', 'Network error or server is unreachable. Please try again later.', 'error');
    }
  };

  const getModalBgClass = (type) => {
    switch (type) {
      case 'success': return 'bg-green-100 border-green-500 text-green-800';
      case 'error': return 'bg-red-100 border-red-500 text-red-800';
      case 'info': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getModalButtonClass = (type) => {
    switch (type) {
      case 'success': return 'bg-green-600 hover:bg-green-700';
      case 'error': return 'bg-red-600 hover:bg-red-700';
      case 'info': return 'bg-blue-600 hover:bg-blue-700';
      default: return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-black font-sans'>
      {messageModal.isVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl p-6 w-full max-w-md border-t-4 ${getModalBgClass(messageModal.type)}`}>
            <h3 className="text-xl font-bold mb-3">{messageModal.title}</h3>
            <p className="mb-6">{messageModal.content}</p>
            <button
              onClick={hideMessageModal}
              className={`px-4 py-2 rounded-lg text-white transition duration-300 ease-in-out ${getModalButtonClass(messageModal.type)}`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className='bg-white backdrop-blur-sm p-10 rounded-xl shadow-2xl w-full max-w-md'>
        <h1 className='text-4xl font-extrabold mb-6 text-center text-gray-900'>Welcome Back</h1>
           
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <label htmlFor="email" className='block text-sm font-semibold text-gray-700'>Email</label>
            <input 
              type="email" 
              onChange={handleChange} 
              name='email' 
              id='email' // Added id for better a11y
              value={form.email} 
              className='mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400'
              required // Added required attribute
            />
          </div>
          <div>
            <label htmlFor="password" className='block text-sm font-semibold text-gray-700'>Password</label>
            <input 
              type="password" 
              onChange={handleChange} 
              name='password' 
              id='password' // Added id for better a11y
              value={form.password} 
              className='mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400'
              required // Added required attribute
            />
          </div>
          <button 
            type='submit' 
            className='w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition duration-300 ease-in-out shadow-md'
          >
            Log In
          </button>
        </form>
        <p className='text-sm text-center text-gray-700 mt-6'>
          Don't have an account?
          <Link to="/Signup" className='text-purple-700 font-medium underline hover:text-purple-900 ml-1'>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
