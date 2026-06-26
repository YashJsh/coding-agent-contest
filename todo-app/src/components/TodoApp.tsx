import React, { useState } from 'react';
import TodoInput from './TodoInput';
import TodoList from './TodoList';
import '../styles/todo.css';

export interface Todo {
  id: number;
  text: string;
}

const TodoApp: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);

  const addTodo = (text: string) => {
    const newTodo: Todo = {
      id: Date.now(),
      text,
    };
    setTodos((prev) => [...prev, newTodo]);
  };

  const removeTodo = (id: number) => {
    setTodos((prev) => prev.filter(todo => todo.id !== id));
  };

  return (
    <div className="todo-app">
      <h1>Todo List</h1>
      <TodoInput addTodo={addTodo} />
      <TodoList todos={todos} removeTodo={removeTodo} />
    </div>
  );
};

export default TodoApp;
