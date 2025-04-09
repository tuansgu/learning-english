import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
        const { token } = await req.json();

        if (!token) {
            return Response.json({ message: "Token không hợp lệ!" }, { status: 400 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return Response.json({ userId: decoded.userId, email: decoded.email }, { status: 200 });

    } catch (error) {
        return Response.json({ message: "Token không hợp lệ hoặc đã hết hạn!" }, { status: 401 });
    }
}
