import Tutorial1 from '../../../../../assets/img/Tutorial1-1.png';
import Tutorial2 from '../../../../../assets/img/Tutorial1-2.png';
import Tutorial3 from '../../../../../assets/img/Tutorial1-3.png';
import yajirusi from '../../../../../assets/img/yajirusi.png';

export default function TutorialDetails1() {
    const images = [Tutorial1, Tutorial2, Tutorial3];

    return (
        <div className="w-full h-[50vh] md:h-[50vh] bg-black/30 backdrop-blur-md border border-white/10 text-white flex flex-col justify-center items-center text-center p-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">「それ、もったいなくない？」</h2>
            <div className="flex justify-around items-center w-full max-w-4xl mx-auto px-4">
                {images.map((src, index) => (
                    <>
                        <div key={index} className="p-1 bg-blue-400 rounded-full shadow-lg mx-2">
                            <div className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden flex justify-center items-center">
                                <img src={src} alt={`Tutorial image ${index + 1}`} className={`w-full h-full object-contain transform transition-transform ${index === 1 ? 'scale-75' : ''} ${index === 2 ? 'scale-75' : ''}`} />
                            </div>
                        </div>
                        {index < images.length - 1 && (
                            <img src={yajirusi} alt="yajirusi" className="w-12 h-12 mx-2" />
                        )}
                    </>
                ))}
            </div>
        </div>
    )
}
