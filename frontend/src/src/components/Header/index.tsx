import { useState, type ReactNode } from "react";
import logoutButton from "../../../assets/img/LogoutButton.png"
import { useNavigate } from "react-router-dom";

interface HeaderProps {
    title: ReactNode;
}

export default function Header({ title }: HeaderProps) {
    const [backHome, setBackHome] = useState(false);
    const navigate = useNavigate();

    const clickHome = () => {
        setBackHome(!backHome);
        navigate("/");
    }


    return (
        <div className="w-full h-20 bg-green-500 border-b-gray-600">
            <div className="flex h-full items-center justify-between">
                <div className="text-2xl font-bold ml-6" onClick={clickHome}>{title}</div>
                <img src={logoutButton} alt="ログアウト" className="mr-6 w-10 h-10" />
            </div>
        </div>
    )
}