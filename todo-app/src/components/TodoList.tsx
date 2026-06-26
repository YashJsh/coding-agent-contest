import React from 'react';
import type { Todo } from './TodoApp';
import TodoItem from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  removeTodo: (id: number) => void;
}

const TodoList: React.FC<TodoListProps> = ({ todos, removeTodo }) => {
  if (todos.length === 0) return <p className="empty-list">No todos yet.</p>;

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} removeTodo={removeTodo} />
      ))}
    </ul>
  );
};

export default TodoList;
