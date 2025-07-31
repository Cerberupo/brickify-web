import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordFieldProps {
  register: any;
  errors?: any;
}

export function PasswordField({ register, errors }: PasswordFieldProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="password">{t('form.password.label')}</Label>
      <Input
        id="password"
        type="password"
        placeholder={t('form.password.placeholder')}
        aria-invalid={errors?.password ? true : undefined}
        {...register('password', {
          required: t('form.password.required')
        })}
      />
      {errors?.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
    </div>
  );
}
