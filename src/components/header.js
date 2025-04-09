'use client';
import { useEffect, useState } from "react";

export default function Header() {
    const [name, setName] = useState("Guest");

    useEffect(() => {
        const storedName = localStorage.getItem('fullname');
        if (storedName) {
            setName(storedName);
        }
    }, []);

    return (
        <div className="d-flex justify-content-around align-items-center py-2 px-4 bg-white">
            <a href="/" className="d-flex align-items-center text-decoration-none">
                <span className="fs-4 fw-bold">Douzipp</span>
            </a>
            <div className="ms-2 text-secondary fs-5">
                <strong>Welcome, {name}</strong>
            </div>
        </div>
    );
}
