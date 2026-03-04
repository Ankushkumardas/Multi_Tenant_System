import { useQuery } from "@tanstack/react-query"; // Updated import to use the correct package name
import type { Task } from "../types"; // Changed to type-only import

const fetchTasks = async ({ queryKey }: { queryKey: [string, string] }): Promise<Task[]> => {
  const [, projectId] = queryKey; // Destructure queryKey to get projectId
  const response = await fetch(`/api/projects/${projectId}/tasks`);
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  return response.json();
};

export const useTasks = (projectId: string) => {
  return useQuery({
    queryKey: ["tasks", projectId],
    queryFn: fetchTasks,
  }); // Updated to use the correct queryKey and queryFn structure
};