import SlideShow from "./SlideShow";
import StartButton from "./StartButton/StartButon";

export default function Main() {
    return(
        <main className="flex-col flex justify-center items-center">
            <SlideShow />
            <StartButton />
        </main>
    )
}