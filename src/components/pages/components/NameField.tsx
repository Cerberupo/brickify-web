import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NameFieldProps {
  register: any;
  errors?: any;
}

export function NameField({ register, errors }: NameFieldProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="name">{t('form.name.label')}</Label>
      <Input
        id="name"
        type="text"
        placeholder={t('form.name.placeholder')}
        aria-invalid={errors?.name ? true : undefined}
        {...register('name', {
          required: t('form.name.required')
        })}
      />
      {errors?.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
    </div>
  );
}
