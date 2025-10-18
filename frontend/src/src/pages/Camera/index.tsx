import Header from "../../components/Header";
import backButton from "../../../assets/img/backPageButton.png"

export default function CameraScreen() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header title={backButton}/>
        </div>
    )
}