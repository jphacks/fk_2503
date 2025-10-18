import Header from "../Header"
import Main from "../Main"
import SlideShow from "../SlideShow/index"

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <SlideShow />
            <Main />    
        </div>
    )
}