from datetime import datetime
import sqlite3
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


DATABASE = "todo.db"

app = FastAPI(title="TODO API")

# 配置跨域 CORS（开发阶段允许全部来源）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_conn() -> sqlite3.Connection:
    """创建 SQLite 连接，并返回可按字段名访问的 Row。"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """初始化任务表。"""
    conn = get_conn()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT DEFAULT '',
            is_completed INTEGER NOT NULL DEFAULT 0,
            create_time TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


@app.on_event("startup")
def on_startup() -> None:
    init_db()


class TaskCreate(BaseModel):
    title: str
    content: Optional[str] = ""


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_completed: Optional[bool] = None


@app.get("/tasks")
def get_all_tasks():
    """获取所有任务。"""
    conn = get_conn()
    rows = conn.execute(
        "SELECT id, title, content, is_completed, create_time FROM tasks ORDER BY id DESC"
    ).fetchall()
    conn.close()
    return [
        {
            "id": row["id"],
            "title": row["title"],
            "content": row["content"],
            "is_completed": bool(row["is_completed"]),
            "create_time": row["create_time"],
        }
        for row in rows
    ]


@app.get("/tasks/{task_id}")
def get_task(task_id: int):
    """根据 ID 获取单个任务。"""
    conn = get_conn()
    row = conn.execute(
        "SELECT id, title, content, is_completed, create_time FROM tasks WHERE id = ?",
        (task_id,),
    ).fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return {
        "id": row["id"],
        "title": row["title"],
        "content": row["content"],
        "is_completed": bool(row["is_completed"]),
        "create_time": row["create_time"],
    }


@app.post("/tasks")
def create_task(task: TaskCreate):
    """创建任务。"""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_conn()
    cursor = conn.execute(
        "INSERT INTO tasks (title, content, is_completed, create_time) VALUES (?, ?, 0, ?)",
        (task.title, task.content or "", now),
    )
    conn.commit()
    task_id = cursor.lastrowid
    row = conn.execute(
        "SELECT id, title, content, is_completed, create_time FROM tasks WHERE id = ?",
        (task_id,),
    ).fetchone()
    conn.close()
    return {
        "id": row["id"],
        "title": row["title"],
        "content": row["content"],
        "is_completed": bool(row["is_completed"]),
        "create_time": row["create_time"],
    }


@app.put("/tasks/{task_id}")
def update_task(task_id: int, task: TaskUpdate):
    """修改任务。"""
    conn = get_conn()
    old_row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if old_row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")

    new_title = task.title if task.title is not None else old_row["title"]
    new_content = task.content if task.content is not None else old_row["content"]
    new_completed = (
        int(task.is_completed) if task.is_completed is not None else old_row["is_completed"]
    )

    conn.execute(
        "UPDATE tasks SET title = ?, content = ?, is_completed = ? WHERE id = ?",
        (new_title, new_content, new_completed, task_id),
    )
    conn.commit()
    row = conn.execute(
        "SELECT id, title, content, is_completed, create_time FROM tasks WHERE id = ?",
        (task_id,),
    ).fetchone()
    conn.close()
    return {
        "id": row["id"],
        "title": row["title"],
        "content": row["content"],
        "is_completed": bool(row["is_completed"]),
        "create_time": row["create_time"],
    }


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    """删除任务。"""
    conn = get_conn()
    cursor = conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}


@app.delete("/tasks/completed/clear")
def clear_completed_tasks():
    """清空已完成任务。"""
    conn = get_conn()
    cursor = conn.execute("DELETE FROM tasks WHERE is_completed = 1")
    conn.commit()
    deleted_count = cursor.rowcount
    conn.close()
    return {"message": "Completed tasks cleared", "deleted_count": deleted_count}
