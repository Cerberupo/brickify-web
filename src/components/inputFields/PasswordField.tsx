import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Eye, EyeOff} from "lucide-react";

interface PasswordFieldProps {
    register: any;
    errors?: any;
}

export function PasswordField({register, errors}: PasswordFieldProps) {
    const {t} = useTranslation();
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="flex flex-col space-y-1.5">
            <Label htmlFor="password">{t('form.password.label')}</Label>
            <div className="relative">
                <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('form.password.placeholder')}
                    aria-invalid={errors?.password ? true : undefined}
                    {...register('password', {
                        required: t('form.password.required'),
                        minLength: {
                            value: 8,
                            message: t('form.password.minLength')
                        },
                        validate: {
                            hasUppercase: (value: string) =>
                                /[A-Z]/.test(value) || t('form.password.hasUppercase'),
                            hasLowercase: (value: string) =>
                                /[a-z]/.test(value) || t('form.password.hasLowercase'),
                            hasNumber: (value: string) =>
                                /[0-9]/.test(value) || t('form.password.hasNumber'),
                            hasSpecialChar: (value: string) =>
                                /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value) || t('form.password.hasSpecialChar')
                        }
                    })}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                    {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                </button>
            </div>
            {errors?.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            <div className="text-xs text-muted-foreground mt-1">
                {t('form.password.requirements')}
            </div>
        </div>
    );
}
