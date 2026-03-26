import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Space,
  Typography,
  message,
} from 'antd'
import {
  clearCompletedTodos,
  createTodo,
  deleteTodo,
  getTodoList,
  updateTodo,
  type TodoDTO,
} from '../api'
import styles from './TodoPage.module.less'

type TodoForm = {
  title: string
  content?: string
}

function TodoPage() {
  const [loading, setLoading] = useState(false)
  const [todos, setTodos] = useState<TodoDTO[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<TodoDTO | null>(null)
  const [editForm] = Form.useForm<TodoForm>()

  const completedCount = useMemo(
    () => todos.filter((todo) => todo.is_completed).length,
    [todos],
  )

  const fetchTodos = async () => {
    setLoading(true)
    try {
      const data = await getTodoList()
      setTodos(data)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取任务失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchTodos()
  }, [])

  const handleCreate = async () => {
    const title = newTitle.trim()
    if (!title) return

    try {
      await createTodo({ title })
      setNewTitle('')
      message.success('任务已添加')
      await fetchTodos()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '添加任务失败')
    }
  }

  const handleToggle = async (todo: TodoDTO) => {
    try {
      await updateTodo(todo.id, { is_completed: !todo.is_completed })
      await fetchTodos()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '更新状态失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteTodo(id)
      message.success('任务已删除')
      await fetchTodos()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除任务失败')
    }
  }

  const openEditModal = (todo: TodoDTO) => {
    setEditingTodo(todo)
    editForm.setFieldsValue({
      title: todo.title,
      content: todo.content || '',
    })
    setEditOpen(true)
  }

  const handleEditOk = async () => {
    if (!editingTodo) return

    try {
      const values = await editForm.validateFields()
      await updateTodo(editingTodo.id, {
        title: values.title.trim(),
        content: values.content?.trim() || '',
      })
      setEditOpen(false)
      setEditingTodo(null)
      message.success('任务已更新')
      await fetchTodos()
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message || '编辑任务失败')
      }
    }
  }

  const handleClearCompleted = async () => {
    try {
      const result = await clearCompletedTodos()
      message.success(`已清空 ${result.deleted_count} 条已完成任务`)
      await fetchTodos()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '清空已完成失败')
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12">
      <Card className={`${styles.todoCard} mx-auto w-full max-w-3xl`}>
        <Space direction="vertical" size={20} className="w-full">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Typography.Title level={2} className="!mb-1">
                任务管理
              </Typography.Title>
              <Typography.Text type="secondary">
                接口来源：http://127.0.0.1:8000/docs
              </Typography.Text>
            </div>
            <Typography.Text>
              完成 {completedCount} / {todos.length}
            </Typography.Text>
          </div>

          <Space.Compact className="w-full">
            <Input
              size="large"
              value={newTitle}
              placeholder="输入任务标题后按回车"
              onChange={(event) => setNewTitle(event.target.value)}
              onPressEnter={() => void handleCreate()}
            />
            <Button
              size="large"
              type="primary"
              onClick={() => void handleCreate()}
            >
              添加任务
            </Button>
          </Space.Compact>

          <div className="flex justify-end">
            <Popconfirm
              title="确认清空所有已完成任务？"
              onConfirm={() => void handleClearCompleted()}
              okText="确认"
              cancelText="取消"
            >
              <Button danger disabled={completedCount === 0}>
                一键清空已完成
              </Button>
            </Popconfirm>
          </div>

          <List
            bordered
            loading={loading}
            dataSource={todos}
            locale={{ emptyText: '暂无任务，快添加一个吧' }}
            renderItem={(item) => (
              <List.Item
                className={styles.listItem}
                actions={[
                  <Button
                    key="edit"
                    type="link"
                    onClick={() => openEditModal(item)}
                  >
                    编辑
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="确认删除该任务？"
                    onConfirm={() => void handleDelete(item.id)}
                    okText="删除"
                    cancelText="取消"
                  >
                    <Button danger type="text">
                      删除
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <Checkbox
                  checked={item.is_completed}
                  onChange={() => void handleToggle(item)}
                  className={item.is_completed ? styles.done : ''}
                >
                  <span>{item.title}</span>
                  {item.content ? (
                    <Typography.Text
                      type="secondary"
                      className={styles.content}
                    >
                      {item.content}
                    </Typography.Text>
                  ) : null}
                </Checkbox>
              </List.Item>
            )}
          />
        </Space>
      </Card>

      <Modal
        title="编辑任务"
        open={editOpen}
        onOk={() => void handleEditOk()}
        onCancel={() => setEditOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item label="内容" name="content">
            <Input.TextArea rows={4} maxLength={300} />
          </Form.Item>
        </Form>
      </Modal>
    </main>
  )
}

export default TodoPage
