import {useTranslation} from 'react-i18next';
import {LoginForm} from "@/components/pages/components/LoginForm.tsx";

export function LoginPage() {
    const {t} = useTranslation();
    return (<div className="grid place-items-center py-20 content-center">
        <LoginForm/>
    </div>)

}