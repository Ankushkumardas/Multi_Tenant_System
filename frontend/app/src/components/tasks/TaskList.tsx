import React, { useState } from "react";
import type { Task } from "../../types";

interface TaskListProps {
  tasks: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    assignedTo: "",
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = filters.status ? task.status === filters.status : true;
    const matchesPriority = filters.priority ? task.priority === filters.priority : true;
    const matchesAssignedTo = filters.assignedTo
      ? task.assignedTo?.some((assignee: any) =>
        typeof assignee === 'string'
          ? assignee.toLowerCase().includes(filters.assignedTo.toLowerCase())
          : assignee.name?.toLowerCase().includes(filters.assignedTo.toLowerCase())
      )
      : true;

    return matchesStatus && matchesPriority && matchesAssignedTo;
  });

  return (
    <div className="task-list">
      <div className="filters flex gap-4 mb-4">
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="border p-2 rounded bg-gray-50 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="REVIEW">Review</option>
          <option value="DONE">Done</option>
        </select>

        <select
          name="priority"
          value={filters.priority}
          onChange={handleFilterChange}
          className="border p-2 rounded bg-gray-50 text-sm"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>

        <input
          type="text"
          name="assignedTo"
          placeholder="Assigned to..."
          value={filters.assignedTo}
          onChange={handleFilterChange}
          className="border p-2 rounded bg-gray-50 text-sm w-64"
        />
      </div>

      <table className="table-auto w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-600">Task Name</th>
            <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-600">Status</th>
            <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-600">Priority</th>
            <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-600">Assigned To</th>
            <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map((task) => (
            <tr key={task._id} className="hover:bg-gray-100">
              <td className="border border-gray-200 p-2 text-sm text-gray-700">{task.title}</td>
              <td className="border border-gray-200 p-2 text-sm text-gray-700">{task.status}</td>
              <td className="border border-gray-200 p-2 text-sm text-gray-700">{task.priority}</td>
              <td className="border border-gray-200 p-2 text-sm text-gray-700">{task.assignedTo?.join(", ")}</td>
              <td className="border border-gray-200 p-2 text-sm text-gray-700">
                <button className="text-blue-500 hover:underline">Edit</button>
                <button className="text-red-500 hover:underline ml-2">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskList;