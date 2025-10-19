import { useEffect } from "react";
import Header from "../../components/Header"
import HomeBody from "../../components/HomeBody"
import background from "../../../assets/img/background.jpg";

export default function Home() {
    useEffect(() => {
        const imageCount = parseInt(localStorage.getItem("imageCount") || "0", 10);
        for (let i = 1; i <= imageCount; i++) {
            localStorage.removeItem(`capturedImage_${i}`);
        }
        localStorage.removeItem("imageCount");
    }, []);

    return (
        <div
            className="flex flex-col min-h-screen"
            style={{
                backgroundImage: `url(${background})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            <Header />
            <HomeBody />
        </div>
    )
}
