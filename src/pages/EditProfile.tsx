import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const editProfileSchema = z.object({
  name: z.string().min(2, { message: 'El nombre es requerido' }),
  phone: z.string().min(10, { message: 'El teléfono es requerido' }),
  skill: z.string().optional(),
  service_description: z.string().optional(),
  rate: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === "") {
        return undefined;
      }
      const parsed = parseFloat(String(val));
      return isNaN(parsed) ? undefined : parsed;
    },
    z.number().positive({ message: 'El costo debe ser un número positivo' }).optional()
  ),
  profile_image_file: z.instanceof(FileList).optional(),
  service_image_file: z.instanceof(FileList).optional(),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

const EditProfile = () => {
  const navigate = useNavigate();
  const { profile, user, loading, refreshProfile } = useAuth();
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [serviceImagePreview, setServiceImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
  });

  const watchedProfileImageFile = watch('profile_image_file');
  const watchedServiceImageFile = watch('service_image_file');

  useEffect(() => {
    if (profile) {
      setValue('name', profile.name ?? '');
      setValue('phone', profile.phone ?? '');
      setProfileImagePreview(profile.profile_image);
      if (profile.type === 'provider') {
        setValue('skill', profile.skill ?? '');
        setValue('service_description', profile.service_description ?? '');
        setValue('rate', profile.rate ?? undefined);
        setServiceImagePreview(profile.service_image);
      }
    }
  }, [profile, setValue]);

  useEffect(() => {
    if (watchedProfileImageFile && watchedProfileImageFile.length > 0) {
      const file = watchedProfileImageFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (profile && !watchedProfileImageFile) {
      setProfileImagePreview(profile.profile_image);
    } else {
      setProfileImagePreview(null);
    }
  }, [watchedProfileImageFile, profile]);

  useEffect(() => {
    if (watchedServiceImageFile && watchedServiceImageFile.length > 0) {
      const file = watchedServiceImageFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setServiceImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (profile && profile.type === 'provider' && !watchedServiceImageFile) {
      setServiceImagePreview(profile.service_image);
    } else {
      setServiceImagePreview(null);
    }
  }, [watchedServiceImageFile, profile]);


  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    if (!user) return null;
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      showError(`Error al subir la imagen: ${uploadError.message}`);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const onSubmit = async (data: EditProfileFormData) => {
    if (!profile || !user) return;

    const toastId = showLoading('Actualizando perfil...');
    let profileImageUrl = profile.profile_image;
    let serviceImageUrl = profile.type === 'provider' ? profile.service_image : null;

    try {
      if (data.profile_image_file && data.profile_image_file.length > 0) {
        const url = await uploadFile(data.profile_image_file[0], 'profile-images');
        if (url) profileImageUrl = url;
        else throw new Error("Error al subir la foto de perfil");
      }

      if (profile.type === 'provider' && data.service_image_file && data.service_image_file.length > 0) {
        const url = await uploadFile(data.service_image_file[0], 'service-images');
        if (url) serviceImageUrl = url;
        else throw new Error("Error al subir la foto del servicio");
      }

      const updateData: any = {
        name: data.name,
        phone: data.phone,
        profile_image: profileImageUrl,
      };

      if (profile.type === 'provider') {
        updateData.skill = data.skill;
        updateData.service_description = data.service_description;
        updateData.rate = data.rate;
        updateData.service_image = serviceImageUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      dismissToast(toastId);
      showSuccess('¡Perfil actualizado con éxito!');
      navigate('/dashboard');

    } catch (err: unknown) {
      dismissToast(toastId);
      console.error('Error al actualizar perfil:', err);
      showError(err instanceof Error ? err.message : String(err || 'Ocurrió un error al actualizar el perfil.'));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (!profile) {
    return <div className="flex items-center justify-center min-h-screen">No se encontró el perfil.</div>;
  }

  const getInitials = (name: string) => name ? name.split(' ').map((n) => n[0]).join('') : '';

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("Validation Errors:", errors);
    }
  }, [errors]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Editar Perfil</CardTitle>
          <CardDescription>Actualiza tu información personal y de servicio.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">¡Error de validación!</strong>
                <span className="block sm:inline"> Por favor, revisa los campos marcados.</span>
              </div>
            )}
            <div className="flex items-center space-x-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileImagePreview || undefined} />
                <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="profile_image_file">Foto de Perfil</Label>
                <Input
                  id="profile_image_file"
                  type="file"
                  accept="image/*"
                  {...register('profile_image_file')}
                  className={cn(errors.profile_image_file && "border-red-500")}
                />
                {errors.profile_image_file && <p className="text-red-500 text-sm font-semibold mt-1">{errors.profile_image_file.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre Completo</Label>
                <Input id="name" {...register('name')} className={cn(errors.name && "border-red-500")} />
                {errors.name && <p className="text-red-500 text-sm font-semibold mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" {...register('phone')} className={cn(errors.phone && "border-red-500")} />
                {errors.phone && <p className="text-red-500 text-sm font-semibold mt-1">{errors.phone.message}</p>}
              </div>
            </div>

            {profile.type === 'provider' && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Información de Proveedor</h3>
                <div>
                  <Label htmlFor="skill">Oficio o Habilidad</Label>
                  <Input id="skill" {...register('skill')} className={cn(errors.skill && "border-red-500")} />
                  {errors.skill && <p className="text-red-500 text-sm font-semibold mt-1">{errors.skill.message}</p>}
                </div>
                <div>
                  <Label htmlFor="service_description">Descripción del Servicio</Label>
                  <Textarea id="service_description" {...register('service_description')} className={cn(errors.service_description && "border-red-500")} />
                  {errors.service_description && <p className="text-red-500 text-sm font-semibold mt-1">{errors.service_description.message}</p>}
                </div>
                <div>
                  <Label htmlFor="rate">Costo Aproximado del Servicio (BCV)</Label>
                  <Input id="rate" type="number" step="0.01" {...register('rate')} value={String(watch('rate') ?? '')} className={cn(errors.rate && "border-red-500")} />
                  {errors.rate && <p className="text-red-500 text-sm font-semibold mt-1">{errors.rate.message}</p>}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 bg-gray-200 rounded border">
                    {serviceImagePreview ? <img src={serviceImagePreview} alt="Service Preview" className="w-full h-full object-cover rounded" /> : <span className="text-xs text-center p-2 text-gray-500">Sin imagen</span>}
                  </div>
                  <div>
                    <Label htmlFor="service_image_file">Foto del Servicio</Label>
                    <Input
                      id="service_image_file"
                      type="file"
                      accept="image/*"
                      {...register('service_image_file')}
                      className={cn(errors.service_image_file && "border-red-500")}
                    />
                    {errors.service_image_file && <p className="text-red-500 text-sm font-semibold mt-1">{errors.service_image_file.message}</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>Guardar Cambios</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProfile;