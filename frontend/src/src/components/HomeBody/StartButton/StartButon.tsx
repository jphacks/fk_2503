import { useNavigate } from "react-router-dom";
import catCharactor from "../../../../assets/img/cat-charactor.png";

export default function StartButton() {
    const navigate = useNavigate();

    const startCamera = () => {
        navigate("/camera")
    }

    return (
        <div className="mt-8 relative">
            <button 
                className="bg-blue-500 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg hover:scale-105 transform transition-transform duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-purple-300"
                onClick={ startCamera }>
                    工作スタート！
            </button>
            <img src={catCharactor} alt="cat" className="absolute -bottom-12 -right-12 w-24 h-24" />
        </div>
    )
}