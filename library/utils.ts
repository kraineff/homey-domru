import axios from 'axios';

export function errorMsg(codes: any) {
    return async (error: Error) => {
        if (axios.isAxiosError(error)) {
            const code = String(error.response?.status);
            const message = codes[code];
            if (message) throw new Error(message);
        }
        throw error;
    };
}