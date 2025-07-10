import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client'; 
import Navbar from '../Components/Navbar'; 

// Corrected: Changed to http:// and fixed the malformed URL
const socket = io('http://localhost:5000/'); 

const TaskViewer = () => {
  const [tasks, setTasks] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

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

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const email = user?.email; 
        setUserEmail(email);

        // Corrected URL
        const res = await fetch('/api/tasks/gettasks');
        const data = await res.json();
        setTasks(data);
      } catch (err) {
        console.error('Error fetching tasks:', err);
      }
    };

    fetchTasks();

    socket.on('taskUpdated', (updatedTask) => {
      console.log('Task updated via socket:', updatedTask); 
      setTasks((prev) =>
        prev.map((task) =>
          task._id === updatedTask._id ? updatedTask : task
        )
      );
    });

    return () => {
      socket.off('taskUpdated');
    };
  }, []);

  const toggleComplete = async (taskId) => {
    const taskToUpdate = tasks.find(task => task._id === taskId);
    if (!taskToUpdate) return; 

    const newCompletedStatus = !taskToUpdate.completed; 
    const newStatus = newCompletedStatus ? 'done' : 'Todo'; 

    try {
      // Corrected URL
      const res = await fetch(`/api/tasks/update/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          completed: newCompletedStatus,
          status: newStatus 
        }), 
      });

      if (res.ok) {
        const updated = await res.json();
        setTasks((prev) =>
          prev.map((task) => (task._id === updated._id ? updated : task))
        );
        socket.emit('taskUpdated', updated); 
        showMessageModal(
          'Task Status Updated!', 
          `Task "${updated.title}" is now ${updated.completed ? 'completed' : 'pending'} and its status is "${updated.status}".`, 
          'success'
        );
      } else {
        const errorText = await res.text();
        console.error('Failed to update task:', errorText);
        let errorMessage = 'Failed to update task. Please try again.';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.msg || errorMessage;
        } catch (parseError) {
          errorMessage = errorText || errorMessage;
        }
        showMessageModal('Update Failed', errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      showMessageModal('Network Error', 'An unexpected error occurred while updating task status. Check your network connection.', 'error');
    }
  };

  const myTasks = tasks.filter(
    (task) =>
      task.assignedUser?.toLowerCase() === userEmail?.toLowerCase()
  );

  const allTasks = tasks; 

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
    <>
    <Navbar /> 
    <div className="h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white px-4 py-10 flex flex-col lg:flex-row items-start lg:items-stretch justify-center gap-8 font-inter">
      {messageModal.isVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-2xl p-6 w-full max-w-md border-t-8 ${getModalBgClass(messageModal.type)}`}>
            <h3 className="text-2xl font-extrabold mb-3">{messageModal.title}</h3>
            <p className="mb-6 text-lg">{messageModal.content}</p>
            <button
              onClick={hideMessageModal}
              className={`px-6 py-3 rounded-lg text-white text-lg font-semibold transition duration-300 ease-in-out transform hover:scale-105 shadow-lg ${getModalButtonClass(messageModal.type)}`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <section className="bg-white text-gray-900 p-8 rounded-3xl shadow-2xl w-full lg:w-2/5 mb-8 lg:mb-0 border border-purple-300 transform hover:scale-[1.005] transition-transform duration-300 ease-in-out animate-fadeInLeft flex flex-col">
        <h2 className="text-4xl font-extrabold text-center mb-8 text-purple-800 tracking-wide">Your Assigned Tasks</h2>
        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
          {myTasks.length === 0 ? (
            <p className="text-center text-gray-500 text-lg py-4">No tasks assigned to you. Time to relax or create one!</p>
          ) : (
            myTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                toggleComplete={toggleComplete}
                setSelectedTask={setSelectedTask}
              />
            ))
          )}
        </div>
      </section>

      <section className="bg-white text-gray-900 p-8 rounded-3xl shadow-2xl w-full lg:w-3/5 border border-indigo-300 transform hover:scale-[1.005] transition-transform duration-300 ease-in-out animate-fadeInRight flex flex-col">
        <h2 className="text-4xl font-extrabold text-center mb-8 text-indigo-800 tracking-wide">All Available Tasks</h2>
        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
          {allTasks.length === 0 ? (
            <p className="text-center text-gray-500 text-lg py-4">No tasks available. Start creating some!</p>
          ) : (
            allTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                toggleComplete={toggleComplete}
                setSelectedTask={setSelectedTask}
              />
            ))
          )}
        </div>
      </section>

      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md relative animate-fadeInUp border-t-8 border-blue-600">
            <h3 className="text-3xl font-bold mb-3 text-blue-800">{selectedTask.title}</h3>
            <p className="text-gray-700 mb-4 text-lg">{selectedTask.description}</p>
            <div className="space-y-2 text-md">
              <p>
                <strong>Status:</strong>{' '}
                <span className={`font-semibold ${selectedTask.completed ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedTask.completed ? '✅ Completed' : '❌ Pending'}
                </span>
            </p>
            <p>
              <strong>Created By:</strong> <span className="font-semibold text-gray-800">{selectedTask.createdBy}</span>
            </p>
            <p>
              <strong>Assigned To:</strong> <span className="font-semibold text-gray-800">{selectedTask.assignedUser || 'Unassigned'}</span>
            </p>
            </div>
            <button
              onClick={() => setSelectedTask(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-3xl transition-colors duration-200"
              aria-label="Close modal"
            >
              &times;
            </button>
            <button
              onClick={() => setSelectedTask(null)}
              className="mt-6 w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition duration-300 ease-in-out shadow-lg transform hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

const TaskCard = ({ task, toggleComplete, setSelectedTask }) => (
  <div
    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-xl transition transform duration-300 ease-in-out mb-4 border-l-8
      ${(task.completed || task.status === 'done') 
        ? 'bg-green-50 border-green-500 hover:bg-green-100 shadow-md' 
        : 'bg-indigo-50 border-indigo-500 hover:bg-indigo-100 shadow-md'
      } 
      hover:scale-[1.01] cursor-pointer`}
  >
    <div className="flex items-center space-x-4 mb-3 sm:mb-0 w-full sm:w-auto">
      <input
        type="checkbox"
        checked={task.completed || task.status === 'done'}
        onChange={() => toggleComplete(task._id)}
        className="h-6 w-6 accent-purple-600 cursor-pointer flex-shrink-0"
      />
      <span
        className={`text-xl font-medium flex-grow ${
          (task.completed || task.status === 'done') ? 'line-through text-gray-500' : 'text-gray-800'
        }`}
      >
        {task.title}
      </span>
    </div>
    <div className="flex items-center space-x-3 mt-3 sm:mt-0 sm:ml-auto">
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
        task.status === 'done' ? 'bg-green-200 text-green-800' :
        task.status === 'in-progress' ? 'bg-yellow-200 text-yellow-800' :
        'bg-blue-200 text-blue-800'
      }`}>
        {task.status.replace('-', ' ')}
      </span>
      <button
        onClick={() => setSelectedTask(task)}
        className="text-md text-purple-600 font-semibold hover:text-purple-800 transition-colors duration-200 hover:underline"
      >
        View Details
      </button>
    </div>
  </div>
);

export default TaskViewer;