import http from '../utils/request'

export type TodoDTO = {
  id: number
  title: string
  content: string
  is_completed: boolean
  create_time: string
}

export type CreateTodoPayload = {
  title: string
  content?: string
}

export type UpdateTodoPayload = Partial<{
  title: string
  content: string
  is_completed: boolean
}>

export const getTodoList = () => http.get<TodoDTO[]>('/tasks')

export const createTodo = (payload: CreateTodoPayload) =>
  http.post<TodoDTO, CreateTodoPayload>('/tasks', payload)

export const updateTodo = (id: number, payload: UpdateTodoPayload) =>
  http.put<TodoDTO, UpdateTodoPayload>(`/tasks/${id}`, payload)

export const deleteTodo = (id: number) =>
  http.delete<{ message: string }>(`/tasks/${id}`)

export const clearCompletedTodos = () =>
  http.delete<{ message: string; deleted_count: number }>(
    '/tasks/completed/clear',
  )
