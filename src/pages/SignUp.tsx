import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { venezuelaStates, citiesByState } from '@/lib/venezuela-data';
import { showError, showSuccess } from '@/utils/toast';

const baseSchema = z.object({
  email: z.string().email({ message: 'Correo electrónico inválido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  name: z.string().min(2, { message: 'El nombre es requerido' }),
  lastName: z.string().min(2, { message: 'El apellido es requerido' }),
  phone: z.string().min(10, { message: 'El teléfono es requerido' }),
  state: z.string({ required_error: 'Seleccione un estado' }),
  city: z.string({ required_error: 'Seleccione una ciudad' }),
});

const clientSchema = baseSchema;
const providerSchema = baseSchema.extend({
  category: z.string({ required_error: 'Seleccione una categoría' }),
  service_description: z.string().min(10, { message: 'La descripción es muy corta' }),
});

type ClientFormData = z.infer<typeof clientSchema>;
type ProviderFormData = z.infer<typeof providerSchema>;

const SignUp = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'client' | 'provider'>('client');
  const [selectedState, setSelectedState] = useState('');

  const currentSchema = userType === 'client' ? clientSchema : providerSchema;
  const { register, handleSubmit, formState: { errors }, control, setValue, watch } = useForm({
    resolver: zodResolver(currentSchema),
  });

  const watchedState = watch('state');

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
      navigate('/');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Tabs defaultValue="client" onValueChange={(value) => setUserType(value as 'client' | 'provider')} className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="client">Soy Cliente</TabsTrigger>
          <TabsTrigger value="provider">Soy Proveedor</TabsTrigger>
        </TabsList>
        <SignUpForm
          type="client"
          onSubmit={handleSubmit(onSubmit)}
          register={register}
          errors={errors}
          control={control}
          setValue={setValue}
          watchedState={watchedState}
        />
        <SignUpForm
          type="provider"
          onSubmit={handleSubmit(onSubmit)}
          register={register}
          errors={errors}
          control={control}
          setValue={setValue}
          watchedState={watchedState}
        />
      </Tabs>
    </div>
  );
};

const SignUpForm = ({ type, onSubmit, register, errors, control, setValue, watchedState }: any) => (
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
              <Label>Estado</Label>
              <Select onValueChange={(value) => setValue('state', value, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Seleccione estado" /></SelectTrigger>
                <SelectContent>
                  {venezuelaStates.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
            </div>
            <div>
              <Label>Ciudad</Label>
              <Select onValueChange={(value) => setValue('city', value, { shouldValidate: true })} disabled={!watchedState}>
                <SelectTrigger><SelectValue placeholder="Seleccione ciudad" /></SelectTrigger>
                <SelectContent>
                  {watchedState && citiesByState[watchedState]?.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
            </div>
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
                <Label htmlFor="service_description">Descripción del Servicio</Label>
                <Textarea id="service_description" {...register('service_description')} />
                {errors.service_description && <p className="text-red-500 text-xs mt-1">{errors.service_description.message}</p>}
              </div>
            </>
          )}
          <Button type="submit" className="w-full">Registrarse</Button>
        </form>
      </CardContent>
    </Card>
  </TabsContent>
);

export default SignUp;