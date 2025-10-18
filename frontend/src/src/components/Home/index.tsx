import Footer from "../Footer"
import Header from "../Header"
import Main from "../Main"

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <Main />
            <Footer />
        </div>
    )
}