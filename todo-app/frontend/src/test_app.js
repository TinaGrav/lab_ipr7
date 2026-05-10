import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import App from './App';

jest.mock('axios');

describe('Todo App Component', () => {
  const mockTodos = [
    { _id: '1', text: 'Learn React', completed: false },
    { _id: '2', text: 'Write tests', completed: true }
  ];

  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockTodos });
    axios.post.mockResolvedValue({ data: { _id: '3', text: 'New todo', completed: false } });
    axios.patch.mockResolvedValue({ data: { _id: '1', text: 'Learn React', completed: true } });
    axios.delete.mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders Todo List heading', async () => {
    render(<App />);
    expect(screen.getByText('Todo List')).toBeInTheDocument();
  });

  test('loads and displays todos on mount', async () => {
    render(<App />);

    expect(axios.get).toHaveBeenCalledWith('/api/todos');

    await waitFor(() => {
      expect(screen.getByText('Learn React')).toBeInTheDocument();
      expect(screen.getByText('Write tests')).toBeInTheDocument();
    });
  });

  test('adds a new todo', async () => {
    render(<App />);

    await screen.findByText('Learn React');
    const input = screen.getByPlaceholderText('New todo');
    await userEvent.type(input, 'New todo item');

    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);

    expect(axios.post).toHaveBeenCalledWith('/api/todos', {
      text: 'New todo item',
      completed: false
    });

    expect(input.value).toBe('');
  });

  test('toggles todo completion', async () => {
    render(<App />);

    await screen.findByText('Learn React');

    const checkboxes = screen.getAllByRole('checkbox');
    const firstCheckbox = checkboxes[0];

    fireEvent.click(firstCheckbox);

    expect(axios.patch).toHaveBeenCalledWith('/api/todos/1', {
      completed: true
    });
  });

  test('deletes a todo', async () => {
    render(<App />);

    await screen.findByText('Learn React');

    const deleteButtons = screen.getAllByText('Delete');
    const firstDeleteButton = deleteButtons[0];

    fireEvent.click(firstDeleteButton);

    expect(axios.delete).toHaveBeenCalledWith('/api/todos/1');
  });

  test('displays completed todos with line-through', async () => {
    render(<App />);

    await waitFor(() => {
      const completedTodo = screen.getByText('Write tests');
      expect(completedTodo).toHaveStyle('text-decoration: line-through');

      const incompleteTodo = screen.getByText('Learn React');
      expect(incompleteTodo).not.toHaveStyle('text-decoration: line-through');
    });
  });

  test('handles API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    axios.get.mockRejectedValue(new Error('Network Error'));

    render(<App />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});