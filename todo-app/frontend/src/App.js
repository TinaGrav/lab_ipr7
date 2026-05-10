import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await axios.get('/api/todos');
      setTodos(res.data);
    } catch (err) {
      console.log('Error:', err);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/todos', { text, completed: false });
      setTodos([...todos, res.data]);
      setText('');
    } catch (err) {
      console.log('Error:', err);
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      const res = await axios.patch(`/api/todos/${id}`, { completed: !completed });
      setTodos(todos.map(t => t._id === id ? res.data : t));
    } catch (err) {
      console.log('Error:', err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`/api/todos/${id}`);
      setTodos(todos.filter(t => t._id !== id));
    } catch (err) {
      console.log('Error:', err);
    }
  };

  return (
    <div className="app">
      <h1>Todo List</h1>
      <form onSubmit={addTodo}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="New todo"
        />
        <button>Add</button>
      </form>
      <ul>
        {todos.map(todo => (
          <li key={todo._id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo._id, todo.completed)}
            />
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;