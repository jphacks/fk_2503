import Footer from "../Footer"
import Header from "../Header/index"

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
                <p>This is the main content.</p>
            </main>
            <Footer />
        </div>
    )
}