import React from 'react'
import{createBrowserRouter,createRoutesFromElements,RouterProvider,Route}from 'react-router-dom';

import Signup from './Pages/Signup.jsx';
import KanbanBoard from './Pages/KanbanBoard.jsx';
import TaskViewer from './Pages/TaskViewer.jsx';
import Login from './Pages/Login.jsx';
import AvatarPage from './Pages/AvatarPage.jsx';

const App = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
      {/*Public Routes*/}
      <Route path='/' element={<Login />}/>
      <Route path='/Signup' element={<Signup />}></Route>
      <Route path='/KanbanBoard' element={<KanbanBoard />}></Route>
      <Route path='/TaskViewer' element={<TaskViewer />}></Route>
      <Route path='/AvatarPage' element={<AvatarPage />}></Route>
      </>
    )
  )
  return (
    <RouterProvider router={router} />
  )
}

export default App