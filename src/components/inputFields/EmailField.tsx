import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmailFieldProps {
  register: any;
  errors?: any;
}

export function EmailField({ register, errors }: EmailFieldProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="email">{t('form.email.label')}</Label>
      <Input
        id="email"
        type="email"
        placeholder={t('form.email.placeholder')}
        aria-invalid={errors?.email ? true : undefined}
        {...register('email', {
          required: t('form.email.required'),
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: t('form.email.invalid')
          }
        })}
      />
      {errors?.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
    </div>
  );
}
