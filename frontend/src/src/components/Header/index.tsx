import logoutButton from "../../../assets/img/LogoutButton.png"

export default function Header() {
    return (
        <div className="w-full h-20 bg-orange-500 border-b-gray-100">
            <div className="flex h-full items-center justify-between">
                <span className="text-2xl font-bold ml-6">リサクリ</span>
                <img src={logoutButton} alt="ログアウト" className="mr-6 w-10 h-10" />
            </div>
        </div>
    )
}