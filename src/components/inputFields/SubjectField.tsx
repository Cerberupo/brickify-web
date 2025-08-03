import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SubjectFieldProps {
  register: any;
  errors?: any;
}

export function SubjectField({ register, errors }: SubjectFieldProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="subject">{t('contactUs.form.subject')}</Label>
      <Input
        id="subject"
        type="text"
        placeholder={t('contactUs.form.subjectPlaceholder')}
        aria-invalid={errors?.subject ? true : undefined}
        {...register('subject', {
          required: t('contactUs.form.subjectRequired')
        })}
      />
      {errors?.subject && <p className="text-sm text-red-500">{errors.subject.message}</p>}
    </div>
  );
}
