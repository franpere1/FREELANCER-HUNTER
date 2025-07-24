import { Button } from "@/components/ui/button";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Briefcase, Search, Wallet, MessageSquare, Star, UserPlus, ClipboardList, Award, Monitor, AlertTriangle, Newspaper, Megaphone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import NewsDialog from "@/components/NewsDialog";

const Index = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);

  useEffect(() => {
    const logVisit = async () => {
      // Usar una clave específica para visitas anónimas
      if (sessionStorage.getItem('anonymousVisitLogged')) {
        return;
      }
      try {
        await supabase.functions.invoke('log-visit', {
          body: { user_id: null }, // Visita anónima
        });
        sessionStorage.setItem('anonymousVisitLogged', 'true');
      } catch (error) {
        console.error("Error logging visit:", error);
      }
    };

    if (!loading && !session) {
      logVisit();
    }
  }, [loading, session]);

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
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setIsNewsDialogOpen(true)}>
            <Newspaper className="mr-2 h-4 w-4" />
            Noticias
          </Button>
          <Link to="/login">
            <Button>Inicio / Registro</Button>
          </Link>
        </div>
      </div>
      
      <div className="text-center mb-16 px-4">
        <div className="relative mx-auto mb-8 flex h-40 w-40 items-center justify-center">
          <Monitor className="h-full w-full text-indigo-300" />
          <Search className="absolute h-20 w-20 text-indigo-500" />
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
          Encuentra al Profesional Perfecto
        </h1>
        <p className="text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
          La plataforma que conecta clientes con los mejores profesionales y técnicos de Latinoamerica.
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

        <Card className="mb-12 bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl text-center flex items-center justify-center gap-3">
              <Megaphone className="h-8 w-8" />
              Anuncio Importante
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg mb-6 max-w-2xl mx-auto">
              ¡Hemos lanzado una nueva guía para proveedores! Aprende cómo optimizar tu perfil para atraer más clientes y destacar en la plataforma.
            </p>
            <Button asChild size="lg" variant="secondary">
              <a href="https://www.dyad.sh/blog" target="_blank" rel="noopener noreferrer">
                Leer la Guía Ahora
              </a>
            </Button>
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

        <div className="text-center mt-16 px-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Términos y Condiciones
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px]">
              <DialogHeader>
                <DialogTitle className="text-2xl">Términos y Condiciones</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[60vh] pr-6">
                <div className="space-y-4 text-left">
                  <h3 className="text-xl font-semibold">Normas de la Comunidad</h3>
                  <p className="text-base text-gray-700">
                    En Freelancer Hunter, valoramos un ambiente de <strong>respeto y profesionalismo</strong>. Es fundamental que toda comunicación entre clientes y proveedores se mantenga cordial, constructiva y libre de cualquier tipo de hostilidad.
                  </p>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="font-semibold text-yellow-800">
                      Cualquier forma de acoso, lenguaje ofensivo, discriminación o comunicación irrespetuosa no será tolerada.
                    </p>
                  </div>
                  <p className="text-base text-gray-700">
                    El administrador de la plataforma se reserva el derecho de monitorear las interacciones y tiene la <strong>plena potestad de suspender, eliminar y/o banear permanentemente</strong> las cuentas de los usuarios (tanto clientes como proveedores) que incumplan con esta norma fundamental, sin previo aviso ni derecho a reembolso.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Al utilizar nuestros servicios, aceptas adherirte a estas condiciones para garantizar una comunidad segura y constructiva para todos.
                  </p>

                  <hr className="my-6" />

                  <h3 className="text-xl font-semibold">Términos de Uso de Tokens</h3>
                  <p className="text-sm text-muted-foreground">
                    Estos Términos y Condiciones regulan el uso de los tokens internos (en adelante, “Tokens”) dentro de la plataforma Freelancer Hunter, en adelante “la Plataforma”.
                  </p>
                  
                  <ol className="list-decimal list-inside space-y-3 text-sm text-gray-600">
                    <li>
                      <strong>Naturaleza de los Tokens</strong>
                      <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                        <li>Los Tokens son unidades digitales internas que permiten a los usuarios acceder a funciones específicas dentro de la Plataforma, como desbloquear información de contacto de proveedores o destacar perfiles.</li>
                        <li>Los Tokens no son dinero, moneda digital, criptoactivo, valor financiero, ni representan propiedad o inversión.</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Compra de Tokens</strong>
                      <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                        <li>Los Tokens pueden ser adquiridos mediante los métodos de pago ofrecidos por la Plataforma.</li>
                        <li>Todas las compras son definitivas y no reembolsables, salvo que la ley aplicable disponga lo contrario.</li>
                        <li>El precio de los Tokens está determinado por la Plataforma y puede ser ajustado sin previo aviso.</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Uso de los Tokens</strong>
                      <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                        <li>Los Tokens solo pueden ser utilizados dentro de la Plataforma.</li>
                        <li>No pueden ser transferidos, intercambiados, vendidos, ni canjeados por dinero, productos o servicios fuera de la Plataforma.</li>
                        <li>La Plataforma se reserva el derecho de modificar las funcionalidades asociadas a los Tokens en cualquier momento.</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Propiedad y derechos</strong>
                      <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                        <li>Los usuarios reconocen que los Tokens son propiedad exclusiva de la Plataforma.</li>
                        <li>El uso de los Tokens está sujeto a las condiciones establecidas en estos Términos y no otorga ningún derecho sobre activos, participación, dividendos o decisiones administrativas.</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Suspensión o cancelación</strong>
                      <p className="pl-4 mt-1">El uso indebido de los Tokens, o cualquier violación a los Términos de la Plataforma, podrá resultar en la cancelación de la cuenta del usuario y/o la pérdida de los Tokens adquiridos sin derecho a reembolso.</p>
                    </li>
                    <li>
                      <strong>Limitación de responsabilidad</strong>
                      <p className="pl-4 mt-1">La Plataforma no será responsable por fallos técnicos, interrupciones, pérdidas de datos o accesos no autorizados que afecten el saldo o uso de los Tokens, salvo dolo o negligencia grave comprobada.</p>
                    </li>
                    <li>
                      <strong>Modificaciones</strong>
                      <p className="pl-4 mt-1">La Plataforma podrá actualizar estos Términos en cualquier momento. Las modificaciones serán publicadas y se considerarán aceptadas si el usuario continúa utilizando los servicios.</p>
                    </li>
                    <li>
                      <strong>Legislación aplicable</strong>
                      <p className="pl-4 mt-1">Estos Términos se rigen por las leyes del país o jurisdicción donde la Plataforma tenga su sede operativa, sin perjuicio de la legislación local del usuario.</p>
                    </li>
                  </ol>
                </div>
              </ScrollArea>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button">Cerrar</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <NewsDialog isOpen={isNewsDialogOpen} onClose={() => setIsNewsDialogOpen(false)} />

      <div className="absolute bottom-0 w-full">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;