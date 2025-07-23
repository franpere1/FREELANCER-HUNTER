import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { countries } from '@/lib/location-data';
import { showError, showSuccess } from '@/utils/toast';

const baseSchema = z.object({
  email: z.string().email({ message: 'Correo electrónico inválido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  name: z.string().min(2, { message: 'El nombre es requerido' }),
  lastName: z.string().min(2, { message: 'El apellido es requerido' }),
  phone: z.string().min(10, { message: 'El teléfono es requerido' }),
  country: z.string({ required_error: 'Seleccione un país' }),
  state: z.string({ required_error: 'Seleccione un estado' }),
  city: z.string().min(2, { message: 'La ciudad es requerida' }),
});

const clientSchema = baseSchema;
const providerSchema = baseSchema.extend({
  category: z.string({ required_error: 'Seleccione una categoría' }),
  skill: z.string().min(2, { message: 'El oficio o habilidad es requerido' }),
  service_description: z.string().min(10, { message: 'La descripción es muy corta' }),
  rate: z.preprocess(
    (a) => a ? parseFloat(z.string().parse(a)) : undefined,
    z.number().positive().optional()
  ),
});

type ClientFormData = z.infer<typeof clientSchema>;
type ProviderFormData = z.infer<typeof providerSchema>;

const SignUp = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'client' | 'provider'>('client');

  const currentSchema = userType === 'client' ? clientSchema : providerSchema;
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      rate: undefined,
    }
  });

  const watchedCountry = watch('country');
  const [states, setStates] = useState<string[]>([]);

  useEffect(() => {
    const countryData = countries.find(c => c.name === watchedCountry);
    setStates(countryData ? countryData.states : []);
    setValue('state', '', { shouldValidate: false });
  }, [watchedCountry, setValue]);

  const onSubmit = async (data: ClientFormData | ProviderFormData) => {
    const { email, password, name, lastName, ...rest } = data;
    const fullName = `${name} ${lastName}`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: fullName,
          type: userType,
          ...rest,
        },
      },
    });

    if (error) {
      showError(error.message);
    } else {
      showSuccess('¡Registro exitoso! Revisa tu correo para verificar tu cuenta.');
      navigate('/login');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Tabs defaultValue="client" onValueChange={(value) => setUserType(value as 'client' | 'provider')} className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="client">Soy Cliente</TabsTrigger>
          <TabsTrigger value="provider">Soy Proveedor</TabsTrigger>
        </TabsList>
        <SignUpForm
          type="client"
          onSubmit={handleSubmit(onSubmit)}
          register={register}
          errors={errors}
          setValue={setValue}
          states={states}
        />
        <SignUpForm
          type="provider"
          onSubmit={handleSubmit(onSubmit)}
          register={register}
          errors={errors}
          setValue={setValue}
          states={states}
        />
      </Tabs>
    </div>
  );
};

const SignUpForm = ({ type, onSubmit, register, errors, setValue, states }: any) => (
  <TabsContent value={type}>
    <Card>
      <CardHeader>
        <CardTitle>Registro de {type === 'client' ? 'Cliente' : 'Proveedor'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="lastName">Apellido</Label>
              <Input id="lastName" {...register('lastName')} />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" {...register('phone')} />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>País</Label>
              <Select onValueChange={(value) => setValue('country', value, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Seleccione país" /></SelectTrigger>
                <SelectContent>
                  {countries.map(country => <SelectItem key={country.name} value={country.name}>{country.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>}
            </div>
            <div>
              <Label>Estado</Label>
              <Select onValueChange={(value) => setValue('state', value, { shouldValidate: true })} disabled={states.length === 0}>
                <SelectTrigger><SelectValue placeholder="Seleccione estado" /></SelectTrigger>
                <SelectContent>
                  {states.map((state: string) => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" {...register('city')} />
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
          </div>
          {type === 'provider' && (
            <>
              <div>
                <Label>Categoría de Servicio</Label>
                <Select onValueChange={(value) => setValue('category', value, { shouldValidate: true })}>
                  <SelectTrigger><SelectValue placeholder="Seleccione categoría" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Servicios Manuales">Servicios Manuales</SelectItem>
                    <SelectItem value="Servicios Digitales">Servicios Digitales</SelectItem>
                    <SelectItem value="Oficios">Oficios</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
              </div>
              <div>
                <Label htmlFor="skill">Oficio o Habilidad</Label>
                <Input id="skill" {...register('skill')} />
                {errors.skill && <p className="text-red-500 text-xs mt-1">{errors.skill.message}</p>}
              </div>
              <div>
                <Label htmlFor="service_description">Descripción del Servicio</Label>
                <Textarea id="service_description" {...register('service_description')} />
                {errors.service_description && <p className="text-red-500 text-xs mt-1">{errors.service_description.message}</p>}
              </div>
              <div>
                <Label htmlFor="rate">Costo Aproximado del Servicio ($)</Label>
                <Input id="rate" type="number" step="0.01" {...register('rate')} />
                {errors.rate && <p className="text-red-500 text-xs mt-1">{errors.rate.message}</p>}
              </div>
            </>
          )}
          <Button type="submit" className="w-full">Registrarse</Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <p>
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Inicia sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  </TabsContent>
);

export default SignUp;