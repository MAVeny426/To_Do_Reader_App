import React,{ useEffect,useState} from 'react';
import { io } from 'socket.io-client';
import Navbar from '../Components/Navbar';

// Corrected: Using http:// instead of https:// and fixing the malformed URL
const socket = io('http://localhost:5000');

const COLUMN_NAMES=['Todo', 'in-progress', 'done'];

const KanbanBoard=()=>{
  const [tasks,setTasks]=useState([]);
  const [formVisible,setFormVisible] = useState(false);
  const [draggedTaskId,setDraggedTaskId]=useState(null);
  const [activityLogs,setActivityLogs]=useState([]);
  const [editingTask,setEditingTask]=useState(null);
  const [editingStatus,setEditingStatus]=useState({});
  const [recentlyUpdatedTasks,setRecentlyUpdatedTasks]=useState({});
  const [commentInputs,setCommentInputs]=useState({});
  const [loggedInUser, setLoggedInUser] = useState(null); 

  const [messageModal, setMessageModal] = useState({
    isVisible:false,title:'',content:'',type:''
  });

  const [confirmModal,setConfirmModal]=useState({
    isVisible: false,title:'',content:'',
    onConfirm:()=>{},
    onCancel:()=>{}
  });

  const [newTask,setNewTask]=useState({
    title:'',
    description:'',
    status:'Todo',
    priority:'Medium',
    assignedUser:'',
    createdBy:'', 
    dueDate:'',
    originalLastModified:''
  });

  const showMessageModal=(title,content,type)=>{
    setMessageModal({isVisible: true,title,content,type
    });
  };

  const hideMessageModal=()=>{
    setMessageModal({isVisible:false,title:'',content:'',type:''
    });
  };

  const showConfirmModal=(title,content,onConfirm,onCancel) => {
    setConfirmModal({isVisible:true,title,content,onConfirm,onCancel
    });
  };

  const hideConfirmModal=()=>{
    setConfirmModal({isVisible:false,title:'',content:'',
      onConfirm:()=>{},
      onCancel:()=>{}});
  };

  useEffect(()=>{
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setLoggedInUser(user);
    }
    fetchTasks();
    fetchLogs();

    const logInterval =setInterval(fetchLogs,5000);

    socket.on('newComment',(updatedTask)=>{
      setTasks((prev)=>
        prev.map((task)=>
          task._id === updatedTask._id?updatedTask:task
        )
      );
    });

    socket.on('taskUpdated',(updatedTask)=>{
      setTasks((prev)=>
        prev.map((task)=>
          task._id === updatedTask._id?updatedTask:task
        )
      );
      setRecentlyUpdatedTasks(prev =>({...prev,[updatedTask._id]:true }));
    });

    socket.on('taskBeingEdited',({taskId,user}) => {
      setEditingStatus((prev)=>({ ...prev,[taskId]:user }));
    });

    socket.on('taskStoppedEditing',({taskId}) =>{
      setEditingStatus((prev)=>{
        const updated={...prev };
        delete updated[taskId];
        return updated;
      });
    });

    return () => {
      clearInterval(logInterval);
      socket.off('newComment');
      socket.off('taskUpdated');
      socket.off('taskBeingEdited');
      socket.off('taskStoppedEditing');
    };
  }, []);

  useEffect(() => {
    Object.keys(recentlyUpdatedTasks).forEach(taskId => {
      if (recentlyUpdatedTasks[taskId]) {
        const timer = setTimeout(() => {
          setRecentlyUpdatedTasks(prev => {
            const newState = {...prev };
            delete newState[taskId];
            return newState;
          });
        }, 3000);
        return () => clearTimeout(timer);
      }
    });
  }, [recentlyUpdatedTasks]);

  const fetchTasks = async () => {
    try {
      // Corrected URL
      const res = await fetch('/api/tasks/gettasks');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks', err);
    }
  };

  const fetchLogs = async () => {
    try {
      // Corrected URL
      const res = await fetch('api/activitylog/latest?limit=20');
      const data = await res.json();
      setActivityLogs(data);
    } catch (err) {
      console.error('Failed to load activity logs', err);
    }
  };

  const logActivity = async (action) => {
    const userDisplayName = loggedInUser?.name || loggedInUser?.email || 'unknown';
    // Corrected URL
    await fetch('/api/activitylog/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, user: userDisplayName })
    });
  };

  const handleSmartAssign = async () => {
    try {
      // Corrected URL
      const usersRes = await fetch("/api/tasks/users");
      const users = await usersRes.json();

      const taskCounts = users.map(user => ({
        user,
        count: tasks.filter(t => t.assignedUser === user.email).length
      }));

      const leastBusyUser = taskCounts.reduce((a, b) => a.count <= b.count ? a : b).user;

      const smartTask = {
        title:'Smart Assigned Task',
        description:'Automatically assigned based on workload',
        assignedUser:leastBusyUser.email,
        createdBy:'System',
        status:'Todo',
        priority:'Medium',
        dueDate:new Date().toISOString().split('T')[0]
      };

      const token = localStorage.getItem('token');
      // Corrected URL
      const res = await fetch('/api/tasks/createtask', {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
          Authorization:`Bearer ${token}`
        },
        body: JSON.stringify(smartTask)
      });

      if (res.ok) {
        const created = await res.json();
        setTasks(prev => [...prev, created]);
        logActivity(`Smart Assigned task to '${leastBusyUser.email}'`);
        socket.emit('taskUpdated', created);
      } else {
        console.error('Smart Assign Failed:',await res.text());
        showMessageModal('Smart Assign Failed', 'Could not smart assign task. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Smart assign error:',err);
      showMessageModal('Smart Assign Error', 'An unexpected error occurred during smart assignment.', 'error');
    }
  };

  const handleChange = (e) => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const taskTitle = newTask.title.trim();

    if (!taskTitle) {
      showMessageModal('Validation Error', 'Task title cannot be empty.', 'error');
      return;
    }

    if (COLUMN_NAMES.some(col => col.toLowerCase() === taskTitle.toLowerCase())) {
      showMessageModal('Validation Error', `Task title cannot be "${taskTitle}". It matches a column name.`, 'error');
      return;
    }

    const isDuplicate = tasks.some(task =>
      task._id !== (editingTask ? editingTask._id : null) &&
      task.title.toLowerCase() === taskTitle.toLowerCase()
    );

    if (isDuplicate) {
      showMessageModal('Validation Error', `A task with the title "${taskTitle}" already exists. Task titles must be unique.`, 'error');
      return;
    }

    const taskWithCreator = { 
      ...newTask, 
      title:taskTitle, 
      createdBy:loggedInUser?.name ||loggedInUser?.email ||'unknown' 
    };

    if (editingTask && editingTask._id) {
      const payload = {...taskWithCreator,originalLastModified:newTask.originalLastModified };

      // Corrected URL
      const res = await fetch(`/api/tasks/update/${editingTask._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type':'application/json',
          Authorization:`Bearer ${token}`
        },
        body:JSON.stringify(payload)
      });

      if (res.ok) {
        const updated = await res.json();
        setTasks(tasks.map(t => (t._id === updated._id ? updated : t)));
        logActivity(`Edited Task '${updated.title}'`);
        socket.emit('taskUpdated',updated);
        socket.emit('stopEditingTask',{ taskId: editingTask._id });
        setRecentlyUpdatedTasks(prev => ({...prev,[updated._id]:true }));
        showMessageModal('Task Updated!',`Task "${updated.title}"successfully updated.`,'success');
      } else {
        const errorText = await res.text();
        console.error('Task update failed:',errorText);
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.conflict) {
            showMessageModal('Update Conflict',errorData.message +" Please refresh to get the latest version.",'error');
            fetchTasks();
          } else {
            showMessageModal('Error Updating Task',errorData.message,'error');
          }
        } catch (parseError) {
          showMessageModal('Error Updating Task',"An unexpected error occurred." +errorText,'error');
        }
      }
      setEditingTask(null);
    } else {
      // Corrected URL
      const res = await fetch('/api/tasks/createtask', {
        method:'POST',
        headers: {
          'Content-Type':'application/json',
          Authorization:`Bearer ${token}`
        },
        body:JSON.stringify(taskWithCreator)
      });

      if (res.ok) {
        logActivity(`Created Task'${newTask.title}'`);
        fetchTasks();
        showMessageModal('Task Created!',`Task "${newTask.title}"successfully created.`,'success');
      } else {
        const errText = await res.text();
        console.error('Task creation failed:',errText);
        showMessageModal('Task Creation Failed',"Could not create task." +errText,'error');
      }
    }

    setFormVisible(false);
    setNewTask({
      title:'',
      description:'',
      status:'Todo',
      priority:'Medium',
      assignedUser:loggedInUser?.email || '', 
      createdBy:loggedInUser?.name || loggedInUser?.email || '',
      dueDate:'',
      originalLastModified:''
    });
  };

  const handleEdit = (task) => {
    const user = JSON.parse(localStorage.getItem('user'));
    setEditingTask(task);
    setNewTask({
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      originalLastModified: task.lastModified || task.updatedAt
    });
    setFormVisible(true);
    socket.emit('editingTask', {
      taskId: task._id,
      user: user?.name || user?.email ||'Someone'
    });
  };

  const handleDelete = async (id) => {
    const task = tasks.find((t) => t._id === id);
    showConfirmModal(
      'Confirm Deletion',
      `Are you sure you want to delete "${task?.title}"? This action cannot be undone.`,
      async () => {
        hideConfirmModal();
        // Corrected URL
        const res = await fetch(`/api/tasks/delete/${id}`, {
          method:'DELETE',
        });

        if (res.ok) {
          setTasks(tasks.filter((t) => t._id !== id));
          logActivity(`Deleted task'${task.title}'`);
          showMessageModal('Task Deleted!',`Task "${task.title}"successfully deleted.`,'success');
        } else {
          console.error('Failed to delete task:',await res.text());
          showMessageModal('Deletion Failed','Could not delete task.Please try again.','error');
        }
      },
      () => {
        hideConfirmModal();
      }
    );
  };

  const handleAddComment = async (taskId, commentText) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const userName = user?.name || user?.email || 'unknown';

    // Corrected URL
    const res = await fetch(`/api/tasks/comment/${taskId}`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({text:commentText,user:userName})
    });

    if (res.ok) {
      const updated = await res.json();
      setTasks(tasks.map((t) =>(t._id === updated._id ? updated : t)));
      logActivity(`Commented on task'${updated.title}'`);
      socket.emit('newComment',updated);
      showMessageModal('Comment Added!','Your comment has been added.','success');
    } else {
      console.error('Failed to add comment:',await res.text());
      showMessageModal('Comment Failed','Could not add comment.Please try again.','error');
    }
  };

  const handleDragStart = (taskId) => {
    setDraggedTaskId(taskId);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const token = localStorage.getItem('token');

    setTasks(prev =>
      prev.map(task =>
        task._id === draggedTaskId ? { ...task, status: newStatus } : task
      )
    );

    try {
      const draggedTask = tasks.find(task => task._id === draggedTaskId);
      const payload = { status: newStatus };
      if (draggedTask) {
        payload.originalLastModified = draggedTask.lastModified || draggedTask.updatedAt;
      }

      // Corrected URL
      const res = await fetch(`/api/tasks/update/${draggedTaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updatedTask = await res.json();
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task._id === updatedTask._id ? updatedTask : task
          )
        );
        logActivity(`Moved task '${updatedTask.title}' to '${newStatus}'`);
        socket.emit('taskUpdated', updatedTask);
        showMessageModal('Status Updated!',`Task "${updatedTask.title}"moved to "${newStatus}".`,'success');
      } else {
        const errorText = await res.text();
        console.error('Failed to update task status:',errorText);
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.conflict) {
            showMessageModal('Update Conflict',errorData.message +" Please refresh to get the latest version.",'error');
            fetchTasks();
          } else {
            showMessageModal('Error Updating Status',errorData.message,'error');
          }
        } catch (parseError) {
          showMessageModal('Error Updating Status',"An unexpected error occurred." +errorText,'error');
        }
        fetchTasks();
      }
    } catch (err) {
      console.error('Error updating task status:',err);
      showMessageModal('Network Error',"An unexpected error occurred while updating task status.Check your network connection.",'error');
      fetchTasks();
    } finally {
      setDraggedTaskId(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
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
    <>
    <Navbar/>
    <div className='flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-gray-900 to-black px-4 py-6 gap-6 font-inter'>
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

      {confirmModal.isVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md border-t-4 border-yellow-500 text-gray-800">
            <h3 className="text-xl font-bold mb-3">{confirmModal.title}</h3>
            <p className="mb-6">{confirmModal.content}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={confirmModal.onCancel}
                className="px-4 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition duration-300 ease-in-out"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition duration-300 ease-in-out"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='bg-white p-8 rounded-xl shadow-2xl w-full md:w-3/4'>
        <h1 className='text-4xl font-extrabold mb-6 text-center text-gray-900'>Kanban Board</h1>

        <div className='flex justify-end mb-4'>
          <button
            onClick={() => {
              setFormVisible(!formVisible);
              if (!formVisible) { 
                setNewTask(prev => ({
                  ...prev,
                  createdBy: loggedInUser?.name || loggedInUser?.email || '', 
                  assignedUser: loggedInUser?.email || '' 
                }));
              } else if (formVisible && editingTask) { 
                const user = JSON.parse(localStorage.getItem('user'));
                socket.emit('stopEditingTask', { taskId: editingTask._id });
                setEditingTask(null);
                setNewTask({
                  title: '',
                  description: '',
                  status: 'Todo',
                  priority: 'Medium',
                  assignedUser: loggedInUser?.email || '',
                  createdBy: loggedInUser?.name || loggedInUser?.email || '',
                  dueDate: '',
                  originalLastModified: ''
                });
              }
            }}
            className='bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition duration-300 ease-in-out shadow-md'
          >
            {formVisible ? 'Close Form' : 'Create Task'}
          </button>

          <button
            onClick={handleSmartAssign}
            className='bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg ml-2 hover:from-blue-600 hover:to-cyan-700 transition duration-300 ease-in-out shadow-md'>
            Smart Assign
          </button>
        </div>

        {formVisible && (
          <form onSubmit={handleSubmit} className='bg-gray-50 p-6 rounded-lg mb-6 shadow-inner border border-gray-200'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <input name='title' value={newTask.title} onChange={handleChange} placeholder='Title' className='p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent' required />
              <input name='assignedUser' value={newTask.assignedUser} onChange={handleChange} placeholder='Assign To (email or name)' className='p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent' />
              <select name='status' value={newTask.status} onChange={handleChange} className='p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent'>
                <option value='Todo'>Todo</option>
                <option value='in-progress'>In Progress</option>
                <option value='done'>Done</option>
              </select>
              <select name='priority' value={newTask.priority} onChange={handleChange} className='p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent'>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
              <input type='date' name='dueDate' value={newTask.dueDate} onChange={handleChange} className='p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent' title="Due Date"
              />
              <div className="p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700">
                Created By: <span className="font-semibold">{newTask.createdBy || 'N/A'}</span>
              </div>
              <textarea name='description' value={newTask.description} onChange={handleChange} placeholder='Description' className='p-2 border border-gray-300 rounded-md col-span-2 focus:ring-2 focus:ring-blue-400 focus:border-transparent'></textarea>
            </div>
            <button type='submit' className='mt-4 bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-teal-700 transition duration-300 ease-in-out shadow-md'>
              {editingTask ? 'Update Task' : 'Add Task'}
            </button>
          </form>
        )}

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {COLUMN_NAMES.map((column) => (
            <div
              key={column}
              className='bg-gradient-to-br from-gray-100 to-gray-200 p-4 rounded-xl shadow-lg min-h-[300px] border-t-4 border-blue-500'
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column)}
            >
              <h2 className='text-2xl font-extrabold text-gray-800 mb-4 text-center capitalize tracking-wide'>{column.replace('-', ' ')}</h2>
              <div className='space-y-4'>
                {tasks.filter((task) => task.status === column).map((task) => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
                  return (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={() => handleDragStart(task._id)}
                      className={`bg-white p-5 rounded-lg shadow-md hover:shadow-xl transition duration-300 ease-in-out cursor-grab active:cursor-grabbing border border-gray-200
                                 ${isOverdue ? 'border-2 border-red-500' : ''}
                                 ${recentlyUpdatedTasks[task._id] && !editingStatus[task._id] ? 'border-2 border-green-500' : ''}
                                 `}
                    >
                      <p className='font-bold text-xl text-gray-900 mb-1'>{task.title}</p>
                      <p className='text-sm text-gray-700 mb-2'>{task.description}</p>
                      <p className='text-xs text-gray-600'>Assigned to: <span className="font-semibold">{task.assignedUser || 'Unassigned'}</span></p>
                      <p className='text-xs text-gray-600'>Created by: <span className="font-semibold">{task.createdBy || 'Unknown'}</span></p> {/* Display 'Unknown' if empty */}
                      {task.dueDate && (
                        <p className={`text-xs mt-1 ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                      <span className={`inline-block mt-3 px-4 py-1 text-xs font-bold rounded-full
                                        ${task.priority === 'High' ? 'bg-red-200 text-red-800' :
                                          task.priority === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                                          'bg-blue-200 text-blue-800'}`}>
                        {task.priority}
                      </span>

                      {editingStatus[task._id] && (
                        <div className="bg-red-100 border border-red-500 text-red-700 px-3 py-1 rounded-md mt-3 text-sm animate-pulse shadow-sm">
                          <span className="font-semibold">{editingStatus[task._id]}</span> is editing this task...
                        </div>
                      )}

                      {recentlyUpdatedTasks[task._id] && !editingStatus[task._id] && (
                          <div className="bg-green-100 border border-green-500 text-green-700 px-3 py-1 rounded-md mt-3 text-sm shadow-sm">
                            Task updated!
                          </div>
                      )}

                      <div className='mt-4 flex gap-4'>
                        <button onClick={() => handleEdit(task)} className='text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline'>Edit</button>
                        <button onClick={() => handleDelete(task._id)} className='text-sm text-red-600 hover:text-red-800 font-medium hover:underline'>Delete</button>
                      </div>

                      <div className='mt-4 pt-4 border-t border-gray-200'>
                        <h4 className="text-base font-semibold mb-2 text-gray-800">Comments</h4>
                        <input
                          type='text'
                          value={commentInputs[task._id] || ''}
                          placeholder='Add a new comment...'
                          className='w-full text-sm p-2 border border-gray-300 rounded-md mb-2 focus:ring-1 focus:ring-purple-400'
                          onChange={(e) =>
                            setCommentInputs({ ...commentInputs, [task._id]: e.target.value })
                          }
                        />
                        <button
                          onClick={() => {
                            if (commentInputs[task._id]?.trim()) {
                              handleAddComment(task._id, commentInputs[task._id].trim());
                              setCommentInputs({ ...commentInputs, [task._id]: '' });
                            }
                          }}
                          className='text-xs bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition duration-300 ease-in-out shadow-sm'
                        >
                          Save Comment
                        </button>

                        <div className='mt-3 space-y-2'>
                          {task.comments?.length > 0 ? (
                            task.comments.map((c, i) => (
                              <div key={i} className='text-xs text-gray-800 bg-gray-100 px-3 py-2 rounded-md shadow-sm'>
                                <p className="font-semibold text-gray-700">{c.user}:</p>
                                <p className="text-gray-700">{c.text}</p>
                                <span className="text-gray-500 text-xs mt-1 block">{new Date(c.timestamp).toLocaleString()}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-500">No comments yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='bg-gray-900 text-white p-6 rounded-xl w-full md:w-1/4 flex flex-col shadow-2xl border border-gray-700'>
        <h3 className='text-2xl font-bold mb-4 text-center text-gray-100'>Activity Log</h3>
        <div className="flex-grow overflow-y-auto">
          <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
            <thead className="bg-gray-700 text-gray-200 sticky top-0 z-10">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-semibold uppercase tracking-wider">Action</th>
                <th className="py-2 px-3 text-left text-xs font-semibold uppercase tracking-wider">User</th>
                <th className="py-2 px-3 text-left text-xs font-semibold uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {activityLogs.map((log, idx) => (
                <tr key={idx} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700 transition duration-150 ease-in-out">
                  <td className="py-2 px-3 text-gray-300 text-sm">{log.action}</td>
                  <td className="py-2 px-3 text-gray-400 text-sm">{log.user}</td>
                  <td className="py-2 px-3 text-gray-500 text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {activityLogs.length === 0 && (
            <p className="text-center text-gray-500 py-4">No activity yet.</p>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default KanbanBoard;