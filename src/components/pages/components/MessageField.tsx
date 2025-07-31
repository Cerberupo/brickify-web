import React from 'react';
import { useTranslation } from 'react-i18next';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface MessageFieldProps {
  register: any;
  errors?: any;
}

export function MessageField({ register, errors }: MessageFieldProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="message">{t('contactUs.form.message')}</Label>
      <Textarea
        id="message"
        placeholder={t('contactUs.form.messagePlaceholder')}
        className="min-h-[120px]"
        aria-invalid={errors?.message ? true : undefined}
        {...register('message', {
          required: t('contactUs.form.messageRequired')
        })}
      />
      {errors?.message && <p className="text-sm text-red-500">{errors.message.message}</p>}
    </div>
  );
}
