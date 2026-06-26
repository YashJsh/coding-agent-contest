import React, { useState } from 'react';
import type { FormEvent } from 'react';

interface TodoInputProps {
  addTodo: (text: string) => void;
}

const TodoInput: React.FC<TodoInputProps> = ({ addTodo }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    addTodo(input.trim());
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="todo-input-form">
      <input
        type="text"
        placeholder="Add a new todo"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="todo-input"
      />
      <button type="submit" className="add-button">Add</button>
    </form>
  );
};

export default TodoInput;
