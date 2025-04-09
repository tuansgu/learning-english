export const decodeTokenBackend = async (token) => {
    try {
        const response = await fetch("/api/auth/decode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        });

        if (!response.ok) throw new Error("Token không hợp lệ!");
        
        const data = await response.json();
        return data; // { userId, email }
    } catch (error) {
        console.error("Lỗi khi giải mã token:", error);
        return null;
    }
};
