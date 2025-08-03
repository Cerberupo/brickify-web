import React from 'react';
import {useTranslation} from 'react-i18next';
import {useForm} from 'react-hook-form';
import {Button, Card, CardContent} from "@/components/ui";
import {EmailField, MessageField, NameField, SubjectField} from "@/components";

export function ContactUsPage() {
    const {t} = useTranslation();
    const {register, handleSubmit, formState: {errors}, reset} = useForm({
        defaultValues: {
            name: '',
            email: '',
            subject: '',
            message: ''
        }
    });
    const [submitted, setSubmitted] = React.useState(false);
    const [error, setError] = React.useState(false);

    const onSubmit = (data: any) => {
        // In a real app, you would send the form data to a server
        console.log('Contact form submitted:', data);

        // Simulate a successful submission
        setSubmitted(true);
        setError(false);
        reset();

        // In a real app, you would handle errors here
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">{t('contactUs.title')}</h1>

            <p className="mb-8">{t('contactUs.introduction')}</p>

            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    {submitted ? (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                            {t('contactUs.success')}
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                            {t('contactUs.error')}
                        </div>
                    ) : null}

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid w-full items-center gap-4">
                            <NameField register={register} errors={errors}/>
                            <EmailField register={register} errors={errors}/>
                            <SubjectField register={register} errors={errors}/>
                            <MessageField register={register} errors={errors}/>
                        </div>
                        <div className="flex flex-col gap-2 mt-4">
                            <Button type="submit">{t('contactUs.form.submit')}</Button>
                        </div>
                    </form>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <h2 className="text-xl font-semibold mb-4">{t('contactUs.contactInfo.title')}</h2>

                        <div className="space-y-4">
                            <div>
                                <p className="font-medium">Address:</p>
                                <p className="text-muted-foreground">{t('contactUs.contactInfo.address')}</p>
                            </div>

                            <div>
                                <p className="font-medium">Email:</p>
                                <p className="text-muted-foreground">{t('contactUs.contactInfo.email')}</p>
                            </div>

                            <div>
                                <p className="font-medium">Phone:</p>
                                <p className="text-muted-foreground">{t('contactUs.contactInfo.phone')}</p>
                            </div>

                            <div>
                                <p className="font-medium">Hours:</p>
                                <p className="text-muted-foreground">{t('contactUs.contactInfo.hours')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
