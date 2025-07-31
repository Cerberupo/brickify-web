import {useTranslation} from 'react-i18next';
import {RegisterForm} from "@/components/pages/components/RegisterForm.tsx";

export function RegisterPage() {
    const {t} = useTranslation();
    return (<div className="grid place-items-center py-20 content-center">
        <RegisterForm/>
    </div>)
}