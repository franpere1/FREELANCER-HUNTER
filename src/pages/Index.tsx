import { Button } from "@/components/ui/button";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Briefcase, Search, Wallet, MessageSquare, Star, UserPlus, ClipboardList, Award } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) {
      navigate('/dashboard');
    }
  }, [session, loading, navigate]);

  if (loading) {
    return <div>Cargando...</div>; // O un spinner de carga
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800 relative pt-24 pb-12">
      {/* Header Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-3">
          <Briefcase className="h-8 w-8 text-indigo-600" />
          <span className="font-bold text-xl text-indigo-700">FREELANCER HUNTER</span>
        </Link>
        <div>
          <Link to="/login">
            <Button>Inicio / Registro</Button>
          </Link>
        </div>
      </div>
      
      <div className="text-center mb-16 px-4">
        <Briefcase className="mx-auto h-24 w-24 text-indigo-500 mb-4" />
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
          FREELANCER HUNTER
        </h1>
        <p className="text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
          La plataforma que conecta clientes con los mejores profesionales y técnicos de Venezuela.
        </p>
      </div>

      <div className="container mx-auto px-4">
        <Card className="mb-12 bg-white/80 backdrop-blur-sm border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl text-center text-gray-800">¿Qué es Freelancer Hunter?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-center text-gray-700 max-w-3xl mx-auto">
              Somos un puente digital diseñado para simplificar la búsqueda y contratación de servicios. Nuestra misión es conectar de forma <strong>rápida, segura y transparente</strong> a personas que necesitan un servicio con los profesionales y técnicos más talentosos del país. Olvídate de las búsquedas interminables, aquí encuentras la ayuda que necesitas con solo unos clics.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-white/80 backdrop-blur-sm border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-indigo-600">Para Clientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-indigo-100 text-indigo-600 rounded-full p-2">
                  <Search className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">1. Busca y Encuentra</h3>
                  <p className="text-gray-600">Explora perfiles de proveedores por habilidad, categoría o ubicación.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-indigo-100 text-indigo-600 rounded-full p-2">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">2. Adquiere Tokens</h3>
                  <p className="text-gray-600">Compra tokens de forma segura. Cada token te permite desbloquear la información de contacto de un proveedor.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-indigo-100 text-indigo-600 rounded-full p-2">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">3. Desbloquea y Contacta</h3>
                  <p className="text-gray-600">Usa un token para ver el teléfono y correo del profesional y chatea directamente en la plataforma.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-indigo-100 text-indigo-600 rounded-full p-2">
                  <Star className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">4. Califica tu Experiencia</h3>
                  <p className="text-gray-600">Al finalizar, deja una reseña para construir una comunidad de confianza.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-blue-600">Para Proveedores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-blue-100 text-blue-600 rounded-full p-2">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">1. Regístrate Gratis</h3>
                  <p className="text-gray-600">Crea tu perfil profesional en minutos y muestra tu talento al mundo.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-blue-100 text-blue-600 rounded-full p-2">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">2. Detalla tus Servicios</h3>
                  <p className="text-gray-600">Describe tus habilidades, experiencia y tarifas para atraer a los clientes correctos.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-blue-100 text-blue-600 rounded-full p-2">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">3. Recibe Contactos Directos</h3>
                  <p className="text-gray-600">Los clientes interesados desbloquearán tu información y te contactarán a través del chat.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-blue-100 text-blue-600 rounded-full p-2">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">4. Construye tu Reputación</h3>
                  <p className="text-gray-600">Recibe calificaciones positivas y aumenta tu visibilidad para conseguir más trabajos.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="absolute bottom-0 w-full">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;