import { useState } from "react"
import { useNavigate } from "react-router-dom";

export default function StartButton() {
    const navigate = useNavigate();
    const [ showCamera, setShowCamera ] = useState(false);

    const startCamera = () => {
        setShowCamera(!showCamera);
        navigate("/camera")
    }

    return (
        <div>
            <button className="bg-blue-500 hover:bg-blue-700 text-white text-xl font-bold py-8 px-16 rounded" onClick={ startCamera }>
                スタート
            </button>
        </div>
    )
}