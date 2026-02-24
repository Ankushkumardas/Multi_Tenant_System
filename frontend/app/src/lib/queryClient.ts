import { QueryClient } from "@tanstack/react-query";

export const queyClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            //    refetchOnMount:false,
            //    refetchOnReconnect:false,
            retry: 1,
        }
    }
})