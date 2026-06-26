import React from 'react';
import type { Todo } from './TodoApp';

interface TodoItemProps {
  todo: Todo;
  removeTodo: (id: number) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, removeTodo }) => {
  return (
    <li className="todo-item">
      <span>{todo.text}</span>
      <button className="remove-button" onClick={() => removeTodo(todo.id)} aria-label={`Remove todo ${todo.text}`}>
        &times;
      </button>
    </li>
  );
};

export default TodoItem;
