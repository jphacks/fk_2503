import logoutButton from "../../../assets/img/LogoutButton.png"

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
    return (
        <div className="w-full h-20 bg-orange-500 border-b-gray-100">
            <div className="flex h-full items-center justify-between">
                <span className="text-2xl font-bold ml-6">{title}</span>
                <img src={logoutButton} alt="ログアウト" className="mr-6 w-10 h-10" />
            </div>
        </div>
    )
}