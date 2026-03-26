import { Navigate, createBrowserRouter } from 'react-router-dom'
import NotFound from '../pages/NotFound'
import TodoPage from '../pages/TodoPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/tasks" replace />,
  },
  {
    path: '/tasks',
    element: <TodoPage />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
])

export default router
