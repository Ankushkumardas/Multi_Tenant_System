import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom"
import { api } from "../lib/axios";

export const useProjects = () => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["projects", slug],
        queryFn: async () => {
            const res = await api.get(`/${slug}/projects`);
            return res.data;
        }
    })
}