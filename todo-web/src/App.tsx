import { useMemo, useState } from 'react'
import { Button, Card, Checkbox, Input, List, Space, Typography } from 'antd'
import styles from './App.module.less'

type TodoItem = {
  id: number
  text: string
  done: boolean
}

function App() {
  const [inputValue, setInputValue] = useState('')
  const [todos, setTodos] = useState<TodoItem[]>([])

  const completedCount = useMemo(
    () => todos.filter((todo) => todo.done).length,
    [todos],
  )

  const addTodo = () => {
    const value = inputValue.trim()
    if (!value) return

    setTodos((prev) => [...prev, { id: Date.now(), text: value, done: false }])
    setInputValue('')
  }

  const toggleTodo = (id: number) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo,
      ),
    )
  }

  const removeTodo = (id: number) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12">
      <Card className={`${styles.todoCard} mx-auto w-full max-w-2xl`}>
        <Space direction="vertical" size={20} className="w-full">
          <div className="flex items-end justify-between gap-4">
            <div>
              <Typography.Title level={2} className="!mb-1">
                Todo List
              </Typography.Title>
              <Typography.Text type="secondary">
                React + TypeScript + Less Module + Tailwind + Antd
              </Typography.Text>
            </div>
            <Typography.Text>
              完成 {completedCount} / {todos.length}
            </Typography.Text>
          </div>

          <Space.Compact className="w-full">
            <Input
              size="large"
              value={inputValue}
              placeholder="输入待办事项后按回车"
              onChange={(event) => setInputValue(event.target.value)}
              onPressEnter={addTodo}
            />
            <Button size="large" type="primary" onClick={addTodo}>
              添加
            </Button>
          </Space.Compact>

          <List
            bordered
            dataSource={todos}
            locale={{ emptyText: '暂无待办，开始添加吧' }}
            renderItem={(item) => (
              <List.Item
                className={styles.listItem}
                actions={[
                  <Button
                    key="delete"
                    danger
                    type="text"
                    onClick={() => removeTodo(item.id)}
                  >
                    删除
                  </Button>,
                ]}
              >
                <Checkbox
                  checked={item.done}
                  onChange={() => toggleTodo(item.id)}
                  className={item.done ? styles.done : ''}
                >
                  {item.text}
                </Checkbox>
              </List.Item>
            )}
          />
        </Space>
      </Card>
    </main>
  )
}

export default App
