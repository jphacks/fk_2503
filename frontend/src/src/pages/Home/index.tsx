import Header from "../../components/Header"
import Main from "../../components/Main"
import SlideShow from "../../components/SlideShow"

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header title="ホーム"/>
            <SlideShow />
            <Main />
        </div>
    )
}