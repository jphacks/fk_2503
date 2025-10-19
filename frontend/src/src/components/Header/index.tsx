import { useNavigate } from "react-router-dom";
import headerBackground from "../../../assets/img/header-background.jpg";
import logo from "../../../assets/img/logo.png";

export default function Header() {
    const navigate = useNavigate();

    const clickHome = () => {
        navigate("/");
    }

    return (
        <div
            className="w-full h-20 border-b-gray-600 flex items-center justify-center"
            style={{
                backgroundImage: `url(${headerBackground})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
            onClick={clickHome}
        >
            <img src={logo} alt="logo" className="h-12 cursor-pointer" />
        </div>
    )
}